import 'server-only';

import { cache } from 'react';

import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import type { UserOverview } from './types';
import { ADMIN_TIMEZONE } from './zone';

/**
 * The one door to the Vokve API's operator surface (`/v1/admin/*`).
 *
 * Every call is made from the server. The backend's admin surface answers the
 * operator's key and no member token (`middleware/admin.ts`). The key is
 * typed once, at sign-in, and traded with the API for a twelve-hour session
 * — with the authenticator's code as well, where the API asks for one
 * (RULES Z7). The session is what the httpOnly cookie holds and what goes
 * out as `x-admin-session`; the key itself is never stored anywhere.
 * Nothing in the client bundle knows the API's address, let alone either.
 */

/**
 * Where a member of staff's session is kept (RULES Z9) — the normal way in:
 * email, password and authenticator, and what they may then do is their
 * permissions, checked by the API on every call.
 */
export const STAFF_SESSION_COOKIE = 'vokve_staff_session';

/** Where the break-glass key's session is kept: the owner's recovery door. */
export const ADMIN_SESSION_COOKIE = 'vokve_admin_session';

/**
 * Where the key itself used to be kept, before sessions. Still read, so a
 * panel signed in before this shipped keeps working until its cookie runs
 * out (or until the API asks for a code); never written again.
 */
export const ADMIN_COOKIE = 'vokve_admin_key';

/** Twelve hours: a working day, after which signing in again is no hardship. */
export const ADMIN_COOKIE_MAX_AGE = 12 * 60 * 60;

export const API_BASE = (process.env.VOKVE_API_URL ?? 'http://localhost:3000/v1').replace(/\/+$/, '');

/**
 * How long a call may take before the panel gives up on it. Writes get far
 * longer: a two-thousand-row import or a 5,000-member broadcast is real work,
 * and cutting one off would leave the operator unsure what happened.
 */
const READ_TIMEOUT_MS = 30_000;
const WRITE_TIMEOUT_MS = 120_000;

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

/** What a call proves who is asking with: a staff session, the key's session, or the bare key. */
export type AdminCredential = { header: 'x-staff-session' | 'x-admin-session' | 'x-admin-key'; value: string };

/**
 * The credential for this request: a staff session, else the key's session,
 * else a key cookie from before sessions.
 *
 * Outside production a key in the environment is accepted as well, so a
 * developer running both halves locally is not asked to sign in on every
 * restart. In production the cookie is the only way in — an environment key
 * would mean anybody who can reach the panel's URL is already an operator.
 */
export async function readAdminCredential(): Promise<AdminCredential | null> {
  const jar = await cookies();
  const staff = jar.get(STAFF_SESSION_COOKIE)?.value;
  if (staff) return { header: 'x-staff-session', value: staff };
  const session = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (session) return { header: 'x-admin-session', value: session };
  const legacy = jar.get(ADMIN_COOKIE)?.value;
  if (legacy) return { header: 'x-admin-key', value: legacy };
  if (process.env.NODE_ENV !== 'production' && process.env.VOKVE_ADMIN_API_KEY) {
    return { header: 'x-admin-key', value: process.env.VOKVE_ADMIN_API_KEY };
  }
  return null;
}

/**
 * The person's own address and browser, for the API's activity log and
 * session list (RULES Z9). Every call reaches the API from this server, so
 * without these the log would say the panel did everything, from here. The
 * API keeps them beside the address it saw and never limits on them.
 */
async function operatorHeaders(): Promise<Record<string, string>> {
  try {
    const incoming = await headers();
    const ip = incoming.get('x-real-ip') ?? incoming.get('x-forwarded-for')?.split(',')[0]?.trim();
    const agent = incoming.get('user-agent');
    return {
      ...(ip && /^[0-9A-Fa-f:.]{3,45}$/.test(ip) ? { 'x-vokve-operator-ip': ip } : {}),
      ...(agent ? { 'x-vokve-operator-agent': agent.slice(0, 300) } : {}),
    };
  } catch {
    // Outside a request (a build-time render): nobody to describe.
    return {};
  }
}

async function call<T>(path: string, init: RequestInit, query?: Query, credential?: AdminCredential): Promise<T> {
  const admin = credential ?? (await readAdminCredential());
  if (!admin) throw new ApiError(401, 'NO_ADMIN_KEY', 'Not signed in.');

  const isWrite = (init.method ?? 'GET') !== 'GET';
  let response: Response;
  try {
    response = await fetch(url(path, query), {
      ...init,
      headers: {
        ...(await operatorHeaders()),
        [admin.header]: admin.value,
        'x-vokve-timezone': ADMIN_TIMEZONE,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
      // Operator data is read to act on. A cached figure is a wrong figure.
      cache: 'no-store',
      // A hung API used to hang the page with it, with no end and nothing on
      // screen. Bounded now, so the panel says which side is stuck.
      signal: init.signal ?? AbortSignal.timeout(isWrite ? WRITE_TIMEOUT_MS : READ_TIMEOUT_MS),
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'TimeoutError') {
      const seconds = (isWrite ? WRITE_TIMEOUT_MS : READ_TIMEOUT_MS) / 1000;
      throw new ApiError(
        504,
        'API_TIMEOUT',
        isWrite
          ? `The API at ${API_BASE} took longer than ${seconds}s to answer. The change may still have gone through — reload the page to check before trying again.`
          : `The API at ${API_BASE} took longer than ${seconds}s to answer. Try again in a moment.`,
      );
    }
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
async function adminSurfaceMissing(credential: AdminCredential): Promise<boolean> {
  try {
    await call('/admin/users', { method: 'GET' }, { limit: 1 }, credential);
    return false;
  } catch (error) {
    return error instanceof ApiError && error.status === 404;
  }
}

/**
 * Where a refusal about *who is asking* sends them (RULES Z9):
 *
 * - no permission for this page → `/dashboard/forbidden`, which names it;
 * - a session that still has to set a password or authenticator → setup;
 * - an account switched off, or switched off with its manager → sign-in,
 *   which says why.
 */
function redirectForAccess(error: ApiError): void {
  if (error.code === 'PERMISSION_DENIED') {
    const need = (error.details as { permission?: string } | null)?.permission ?? '';
    redirect(`/dashboard/forbidden?need=${encodeURIComponent(need)}`);
  }
  if (error.code === 'STAFF_SETUP_REQUIRED') redirect('/auth/setup');
  if (error.code === 'STAFF_MANAGER_INACTIVE' || error.code === 'STAFF_SUSPENDED') redirect('/auth/sign-in?from=blocked');
  if (error.code === 'ADMIN_MFA_REQUIRED') redirect('/auth/sign-in?from=expired');
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
    if (error instanceof ApiError) redirectForAccess(error);
    if (error instanceof ApiError && (error.status === 401 || error.code === 'NO_ADMIN_KEY')) {
      redirect('/auth/sign-in?from=expired');
    }
    if (error instanceof ApiError && error.status === 404) {
      const credential = await readAdminCredential();
      if (credential && (await adminSurfaceMissing(credential))) {
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
    // A panel this person may not read says so in place (the API's own
    // sentence names the permission); the rest of the page still renders.
    if (error instanceof ApiError && error.code !== 'PERMISSION_DENIED') redirectForAccess(error);
    if (error instanceof ApiError && (error.status === 401 || error.code === 'NO_ADMIN_KEY')) {
      redirect('/auth/sign-in?from=expired');
    }
    if (error instanceof ApiError) return { error };
    throw error;
  }
}

export type WriteResult<T> =
  | { ok: true; data: T }
  /** `details` is the API's own, field by field — for a form that marks the box rather than only saying so. */
  | { ok: false; error: string; code: string; details?: unknown };

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
  // A refusal for want of a permission is a sentence already ("You do not
  // have permission to refund an order. Ask your manager…"); its details are
  // the permission's key, for the forbidden page, not for a person.
  if (error.code === 'PERMISSION_DENIED') return error.message;
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
    if (error instanceof ApiError) return { ok: false, error: readableError(error), code: error.code, details: error.details };
    throw error;
  }
}

/** What `/admin/staff/me` answers: the person, or `root` for the key. */
export type StaffMe = {
  kind: 'staff' | 'root';
  id: string;
  name: string;
  email: string | null;
  role: 'root' | 'admin' | 'manager' | 'agent';
  manager: { id: string; name: string; email: string; status: string } | null;
  effectivePermissions: string[];
  setup: { changePassword: boolean; enrollTotp: boolean };
  totpEnabled: boolean;
};

/** Who is signed in, once per request however many components ask. */
export const currentStaff = cache(async (): Promise<StaffMe | null> => {
  const credential = await readAdminCredential();
  if (!credential) return null;
  try {
    return await call<StaffMe>('/admin/staff/me', { method: 'GET' }, undefined, credential);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) return null;
    throw error;
  }
});

export type StaffSignInVerdict =
  | { ok: true; token: string; maxAgeSeconds: number; setup: { changePassword: boolean; enrollTotp: boolean } }
  | { ok: false; reason: string; needsCode?: boolean };

/**
 * A member of staff signing in (RULES Z9): email, password, and the six
 * digits once they have an authenticator. The API decides everything; this
 * only turns its codes into the sentence the form shows.
 */
export async function staffSignIn(email: string, password: string, code?: string): Promise<StaffSignInVerdict> {
  let response: Response;
  try {
    response = await fetch(url('/admin/staff/login'), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-vokve-timezone': ADMIN_TIMEZONE, ...(await operatorHeaders()) },
      body: JSON.stringify(code ? { email, password, code } : { email, password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: `The API at ${API_BASE} did not answer. Is vokve-backend running?` };
  }
  const body = (safeJsonOrNull(await response.text()) ?? {}) as {
    token?: string;
    expiresAt?: number;
    setup?: { changePassword: boolean; enrollTotp: boolean };
    error?: { code?: string; message?: string; details?: Record<string, unknown> | null };
  };
  if (response.ok && body.token) {
    const remaining = Math.floor(((body.expiresAt ?? 0) - Date.now()) / 1000);
    return {
      ok: true,
      token: body.token,
      maxAgeSeconds: Math.max(60, Math.min(ADMIN_COOKIE_MAX_AGE, remaining > 0 ? remaining : ADMIN_COOKIE_MAX_AGE)),
      setup: body.setup ?? { changePassword: false, enrollTotp: false },
    };
  }
  const code_ = body.error?.code;
  if (code_ === 'STAFF_MFA_REQUIRED' || code_ === 'STAFF_MFA_INVALID') {
    return { ok: false, needsCode: true, reason: body.error?.message ?? 'Enter the code from your authenticator app.' };
  }
  if (code_ === 'VALIDATION_FAILED') return { ok: false, reason: 'Enter a valid email address and your password.' };
  return { ok: false, reason: body.error?.message ?? `The API answered ${response.status}.` };
}

/** A write on one's own behalf before the dashboard is open (setup), with the session given. */
export async function staffCall<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<WriteResult<T>> {
  try {
    const data = await call<T>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: readableError(error), code: error.code };
    throw error;
  }
}

export type SignInVerdict =
  | { ok: true; credential: AdminCredential; maxAgeSeconds: number }
  | { ok: false; reason: string; needsCode?: boolean };

/**
 * Trades the key (and the authenticator's code) for a session (RULES Z7).
 *
 * A wrong key answers 401; a server that wants a code says
 * `ADMIN_MFA_REQUIRED`, which is the form's cue to ask for one. A 404 is
 * either an API from before sessions or one with no `ADMIN_API_KEY` at all
 * (`middleware/admin.ts`) — the old check below tells which, and an old API
 * is signed into the old way so the two halves can be deployed in either
 * order.
 */
export async function signInToApi(key: string, code?: string): Promise<SignInVerdict> {
  let response: Response;
  try {
    response = await fetch(url('/admin/session'), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-vokve-timezone': ADMIN_TIMEZONE, ...(await operatorHeaders()) },
      body: JSON.stringify(code ? { key, code } : { key }),
      cache: 'no-store',
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: `The API at ${API_BASE} did not answer. Is vokve-backend running?` };
  }
  const body = (safeJsonOrNull(await response.text()) ?? {}) as {
    token?: string;
    expiresAt?: number;
    error?: { code?: string; message?: string; details?: { retryAfterSeconds?: number } };
  };

  if (response.ok && body.token) {
    const remaining = Math.floor(((body.expiresAt ?? 0) - Date.now()) / 1000);
    const maxAgeSeconds = Math.max(60, Math.min(ADMIN_COOKIE_MAX_AGE, remaining > 0 ? remaining : ADMIN_COOKIE_MAX_AGE));
    return { ok: true, credential: { header: 'x-admin-session', value: body.token }, maxAgeSeconds };
  }
  const errorCode = body.error?.code;
  if (errorCode === 'ADMIN_MFA_REQUIRED') {
    return { ok: false, needsCode: true, reason: code ? 'Enter the six-digit code from your authenticator app.' : 'This API asks for a code from your authenticator app as well as the key.' };
  }
  if (errorCode === 'ADMIN_MFA_INVALID') return { ok: false, needsCode: true, reason: body.error?.message ?? 'That code was refused.' };
  if (response.status === 429) {
    const wait = Math.ceil((body.error?.details?.retryAfterSeconds ?? 900) / 60);
    return { ok: false, reason: `Too many wrong attempts from here. Try again in ${wait} minutes.` };
  }
  if (response.status === 401) return { ok: false, reason: 'That key was refused.' };
  if (response.status === 404) {
    const legacy: AdminCredential = { header: 'x-admin-key', value: key };
    try {
      await call('/admin/users', { method: 'GET' }, { limit: 1 }, legacy);
      return { ok: true, credential: legacy, maxAgeSeconds: ADMIN_COOKIE_MAX_AGE };
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
  return { ok: false, reason: body.error?.message ?? `The API answered ${response.status}.` };
}

function safeJsonOrNull(text: string): unknown {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
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
