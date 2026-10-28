import 'server-only';

import { cache } from 'react';

import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import type { UserOverview } from './types';
import { ADMIN_TIMEZONE } from './zone';

/**
 * The one door to the Vokve API's operator surface (`/v1/admin/*`).
 *
 * Every call is made from the server. The backend's admin surface answers one
 * key and no member token (`middleware/admin.ts`), so that key is the whole
 * credential — and it never reaches the browser: it lives in an httpOnly
 * cookie the operator sets at sign-in, is read here on the server, and is
 * attached as `x-admin-key` on the way out. Nothing in the client bundle
 * knows the API's address, let alone the key.
 */

/** Where the operator's key is kept between requests. */
export const ADMIN_COOKIE = 'vokve_admin_key';

/** Twelve hours: a working day, after which signing in again is no hardship. */
export const ADMIN_COOKIE_MAX_AGE = 12 * 60 * 60;

export const API_BASE = (process.env.VOKVE_API_URL ?? 'http://localhost:3000/v1').replace(/\/+$/, '');

/**
 * The zone every date on the dashboard is bucketed in. Sent as
 * `X-Vokve-Timezone`, which is what the API's own request context reads, so a
 * "day" here is the day the operator is living in rather than UTC's.
 *
 * Declared in `./zone` and re-exported here: this file is `server-only`, and
 * the formatters need the same constant on both sides of that line.
 */
export { ADMIN_TIMEZONE } from './zone';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type Query = Record<string, string | number | boolean | null | undefined>;

function url(path: string, query?: Query): string {
  const target = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    target.searchParams.set(key, String(value));
  }
  return target.toString();
}

/**
 * The key, from the cookie the operator signed in with.
 *
 * Outside production a key in the environment is accepted as well, so a
 * developer running both halves locally is not asked to sign in on every
 * restart. In production the cookie is the only way in — an environment key
 * would mean anybody who can reach the panel's URL is already an operator.
 */
export async function readAdminKey(): Promise<string | null> {
  const stored = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (stored) return stored;
  if (process.env.NODE_ENV !== 'production' && process.env.VOKVE_ADMIN_API_KEY) {
    return process.env.VOKVE_ADMIN_API_KEY;
  }
  return null;
}

async function call<T>(path: string, init: RequestInit, query?: Query, key?: string): Promise<T> {
  const adminKey = key ?? (await readAdminKey());
  if (!adminKey) throw new ApiError(401, 'NO_ADMIN_KEY', 'Not signed in.');

  let response: Response;
  try {
    response = await fetch(url(path, query), {
      ...init,
      headers: {
        'x-admin-key': adminKey,
        'x-vokve-timezone': ADMIN_TIMEZONE,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
      // Operator data is read to act on. A cached figure is a wrong figure.
      cache: 'no-store',
    });
  } catch (cause) {
    throw new ApiError(
      503,
      'API_UNREACHABLE',
      `The API at ${API_BASE} did not answer. Is vokve-backend running?`,
      cause instanceof Error ? cause.message : cause,
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const body = text ? safeJson(text) : null;

  if (!response.ok) {
    const error = (body as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? `HTTP_${response.status}`,
      error?.message ?? `The API answered ${response.status}.`,
      error?.details ?? null,
    );
  }
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * Which kind of 404 this is.
 *
 * The API answers 404 for two completely different things, with the same
 * code and nearly the same message: a subject that is not there, and — when
 * `ADMIN_API_KEY` is unset — *every* admin route, because a server that was
 * never meant to be administered should not advertise a door to knock on
 * (`middleware/admin.ts`). Telling them apart matters: one is a stale link,
 * the other is a server nobody has configured, and "no such account" would
 * send an operator hunting for the account instead of for the variable.
 *
 * So the cheapest admin route is asked. If that 404s too, the surface is the
 * problem rather than the subject. One extra request, only ever on the error
 * path.
 */
async function adminSurfaceMissing(key: string): Promise<boolean> {
  try {
    await call('/admin/users', { method: 'GET' }, { limit: 1 }, key);
    return false;
  } catch (error) {
    return error instanceof ApiError && error.status === 404;
  }
}

/**
 * A read for a page to render.
 *
 * Two answers are not errors to show, they are somewhere to go:
 *
 *   - **401, or no key at all** sends the operator to the sign-in page. The
 *     only thing to do about it is sign in, and a page that said "401" and
 *     stopped would be asking them to find the way there themselves.
 *   - **404 for a subject** renders the nearest `not-found.tsx` through
 *     Next's own `notFound()`. A member who has been deleted, or a link from
 *     a database that has since been replaced, is an ordinary thing to open
 *     by accident — and it used to throw an unhandled `ApiError` and put a
 *     stack trace where the account should have been.
 *
 * Anything else is thrown, because a page that cannot be read should say so
 * rather than pretend the thing it was reading about does not exist.
 */
export async function adminGet<T>(path: string, query?: Query): Promise<T> {
  try {
    return await call<T>(path, { method: 'GET' }, query);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.code === 'NO_ADMIN_KEY')) {
      redirect('/auth/sign-in?from=expired');
    }
    if (error instanceof ApiError && error.status === 404) {
      const key = await readAdminKey();
      if (key && (await adminSurfaceMissing(key))) {
        throw new ApiError(
          404,
          'NO_ADMIN_SURFACE',
          `The API at ${API_BASE} has no admin surface: every /admin route answers 404. Set ADMIN_API_KEY on vokve-backend and restart it.`,
        );
      }
      notFound();
    }
    throw error;
  }
}

/**
 * The same read, but for a page that would rather show the fault than fail:
 * returns the error instead of throwing, so one dead panel does not take the
 * dashboard with it.
 *
 * Deliberately *not* built on `adminGet`: that turns a 404 into Next's
 * `notFound()`, which throws past this `catch` by design and would render the
 * not-found page for the whole route — exactly what a caller using this
 * asked not to happen. The 401 redirect is kept, because signing in again is
 * still the only thing to do about it.
 */
export async function adminTry<T>(path: string, query?: Query): Promise<{ data: T } | { error: ApiError }> {
  try {
    return { data: await call<T>(path, { method: 'GET' }, query) };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.code === 'NO_ADMIN_KEY')) {
      redirect('/auth/sign-in?from=expired');
    }
    if (error instanceof ApiError) return { error };
    throw error;
  }
}

export type WriteResult<T> = { ok: true; data: T } | { ok: false; error: string; code: string };

/**
 * The sentence to put in front of the operator.
 *
 * A 422 from the API says "Check the highlighted fields" and puts the actual
 * reason in `details` — field by field, and sometimes as a whole sentence
 * ("coins.sourceCaps.steps (900) exceeds coins.dailyCap (300)"). A form that
 * showed only the message would be telling somebody to look at a highlight
 * that does not exist, so the details are what gets shown and the message is
 * the fallback.
 */
export function readableError(error: ApiError): string {
  const { details } = error;
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    const lines = Object.entries(details as Record<string, unknown>)
      .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
      .map(([field, value]) => (field === 'config' ? String(value) : `${field}: ${value}`));
    if (lines.length > 0) return lines.join(' · ');
  }
  return error.message;
}

/**
 * A write — a fraud verdict, a re-score, a release, the update wall.
 *
 * Never redirects: a server action that threw a redirect out of a `catch`
 * would lose whatever the operator had typed. It reports instead, and the
 * form says so.
 */
export async function adminWrite<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<WriteResult<T>> {
  try {
    const data = await call<T>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: readableError(error), code: error.code };
    throw error;
  }
}

/**
 * Whether a key opens the door, asked of the cheapest admin route there is.
 *
 * A wrong key answers 401 and an unconfigured server answers 404 — and the
 * 404 is not a mistake to correct here: it means `ADMIN_API_KEY` is unset on
 * the API, which no key can fix (`middleware/admin.ts`).
 */
export async function verifyAdminKey(key: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    await call('/admin/users', { method: 'GET' }, { limit: 1 }, key);
    return { ok: true };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 401) return { ok: false, reason: 'That key was refused.' };
    if (error.status === 404) {
      return {
        ok: false,
        reason: `The API at ${API_BASE} has no admin surface — set ADMIN_API_KEY on vokve-backend and restart it.`,
      };
    }
    return { ok: false, reason: error.message };
  }
}

/**
 * One member's overview, read once per request however many panels ask.
 *
 * The frame and the tab inside it both need the account — the frame for the
 * name, the tab for the zone its timestamps are written in — and they render
 * in the same pass, so `cache` is what keeps that one HTTP call rather than
 * two.
 */
export const memberOverview = cache(
  (userId: string): Promise<UserOverview> => adminGet<UserOverview>(`/admin/users/${encodeURIComponent(userId)}`),
);

/**
 * The zone this member's own instants are written in: the one their phone
 * last reported, falling back to the panel's.
 *
 * What happened on a member's phone happened on their clock, and a panel that
 * writes it on the operator's is how a hold that clears at 6:44 pm gets read
 * as 1:14 pm. Aggregates stay in `ADMIN_TIMEZONE` — days from two zones
 * cannot be added up — so this is for a member's own timestamps only.
 */
export async function memberZone(userId: string): Promise<string> {
  const { account } = await memberOverview(userId);
  return account.timezone || ADMIN_TIMEZONE;
}
