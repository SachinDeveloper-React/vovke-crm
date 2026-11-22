'use server';

import QRCode from 'qrcode';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ADMIN_COOKIE, ADMIN_SESSION_COOKIE, STAFF_SESSION_COOKIE, signInToApi, staffCall, staffSignIn } from './api';

export type SignInState = { error?: string; needsCode?: boolean };

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: 'strict' as const,
  // Served over HTTPS in production — what keeps the session off the wire.
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge,
});

/**
 * A member of staff signing in (RULES Z9): email, password, and the
 * authenticator's code once they have one. The cookie keeps the API's
 * session token — never the password — and the API checks it, and the
 * permissions behind it, on every call.
 */
export async function signIn(_previous: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  const code = String(form.get('code') ?? '').replace(/\s+/g, '');
  if (!email || !password) return { error: 'Enter your email and password.' };
  if (code && !/^\d{6}$/.test(code)) return { error: 'The authenticator code is six digits.', needsCode: true };

  const verdict = await staffSignIn(email, password, code || undefined);
  if (!verdict.ok) return { error: verdict.reason, needsCode: verdict.needsCode };

  const jar = await cookies();
  jar.set(STAFF_SESSION_COOKIE, verdict.token, cookieOptions(verdict.maxAgeSeconds));
  // One door at a time: a key session left beside a staff one would decide
  // nothing, and would confuse whoever reads the cookies.
  jar.delete(ADMIN_SESSION_COOKIE);
  jar.delete(ADMIN_COOKIE);
  redirect(verdict.setup.changePassword || verdict.setup.enrollTotp ? '/auth/setup' : '/dashboard');
}

/**
 * The owner's recovery door: the API's `ADMIN_API_KEY` (and its own
 * authenticator code, where `ADMIN_TOTP_SECRET` is set), traded for a
 * twelve-hour session that acts as `root`. For when every admin account is
 * locked out — every use is on the activity log.
 */
export async function signInWithKey(_previous: SignInState, form: FormData): Promise<SignInState> {
  const key = String(form.get('key') ?? '').trim();
  const code = String(form.get('code') ?? '').replace(/\s+/g, '');
  if (!key) return { error: 'Paste the admin key.' };
  if (code && !/^\d{6}$/.test(code)) return { error: 'The authenticator code is six digits.', needsCode: true };

  const verdict = await signInToApi(key, code || undefined);
  if (!verdict.ok) return { error: verdict.reason, needsCode: verdict.needsCode };

  const jar = await cookies();
  jar.set(verdict.credential.header === 'x-admin-session' ? ADMIN_SESSION_COOKIE : ADMIN_COOKIE, verdict.credential.value, cookieOptions(verdict.maxAgeSeconds));
  if (verdict.credential.header === 'x-admin-session') jar.delete(ADMIN_COOKIE);
  jar.delete(STAFF_SESSION_COOKIE);
  redirect('/dashboard');
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  // Ended on the server too, so the token is dead even if a copy of the
  // cookie survives somewhere.
  if (jar.get(STAFF_SESSION_COOKIE)) await staffCall('POST', '/admin/staff/logout');
  jar.delete(STAFF_SESSION_COOKIE);
  jar.delete(ADMIN_SESSION_COOKIE);
  jar.delete(ADMIN_COOKIE);
  redirect('/auth/sign-in');
}

// ─── One's own account: first-time setup, and My account ────────────────────

export type FormState = { ok?: string; error?: string };

export async function changeMyPassword(_previous: FormState, form: FormData): Promise<FormState> {
  const currentPassword = String(form.get('currentPassword') ?? '');
  const newPassword = String(form.get('newPassword') ?? '');
  const confirm = String(form.get('confirmPassword') ?? '');
  if (!currentPassword || !newPassword) return { error: 'Fill in both passwords.' };
  if (newPassword !== confirm) return { error: 'The two new passwords are not the same.' };
  const result = await staffCall<{ otherSessionsSignedOut: number }>('POST', '/admin/staff/me/password', { currentPassword, newPassword });
  if (!result.ok) return { error: result.error };
  const others = result.data.otherSessionsSignedOut;
  return { ok: `Password changed.${others ? ` ${others} other session${others === 1 ? ' was' : 's were'} signed out.` : ''}` };
}

export type AuthenticatorState = { error?: string; secret?: string; uri?: string; qr?: string };

/** A fresh secret to scan. Pending until a code from it comes back. */
export async function startAuthenticator(): Promise<AuthenticatorState> {
  const result = await staffCall<{ secret: string; uri: string }>('POST', '/admin/staff/me/totp/setup');
  if (!result.ok) return { error: result.error };
  const svg = await QRCode.toString(result.data.uri, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
  return {
    secret: result.data.secret,
    uri: result.data.uri,
    // A data URI rather than inline markup: the page's CSP allows `data:`
    // images, and nothing is ever handed to the DOM as HTML.
    qr: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
  };
}

export async function confirmAuthenticator(previous: AuthenticatorState, form: FormData): Promise<AuthenticatorState> {
  const code = String(form.get('code') ?? '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(code)) return { ...previous, error: 'Enter the six digits the app shows now.' };
  const result = await staffCall('POST', '/admin/staff/me/totp/confirm', { code });
  if (!result.ok) return { ...previous, error: result.error };
  redirect('/auth/setup');
}

export async function endMySession(_previous: FormState, form: FormData): Promise<FormState> {
  const id = String(form.get('sessionId') ?? '');
  const result = await staffCall('DELETE', `/admin/staff/me/sessions/${encodeURIComponent(id)}`);
  if (!result.ok) return { error: result.error };
  revalidatePath('/dashboard/account');
  return { ok: 'That session is signed out.' };
}

/** The setup page's password step: the same change, then on to the next step. */
export async function setupPassword(previous: FormState, form: FormData): Promise<FormState> {
  const result = await changeMyPassword(previous, form);
  if (result.error) return result;
  redirect('/auth/setup');
}
