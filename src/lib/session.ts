'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, verifyAdminKey } from './api';

export type SignInState = { error?: string };

/**
 * Signing in is proving you hold the operator's key.
 *
 * There is no admin account to log into — the API's admin surface answers one
 * key and nothing else — so this panel's sign-in is that key, checked against
 * the API before it is stored. Storing it unchecked would hand the operator a
 * dashboard of 401s and no idea why.
 */
export async function signIn(_previous: SignInState, form: FormData): Promise<SignInState> {
  const key = String(form.get('key') ?? '').trim();
  if (!key) return { error: 'Paste the admin key.' };

  const verdict = await verifyAdminKey(key);
  if (!verdict.ok) return { error: verdict.reason };

  (await cookies()).set(ADMIN_COOKIE, key, {
    httpOnly: true,
    sameSite: 'strict',
    // Serve the panel over HTTPS in production — this is what keeps the key
    // off the wire in the clear.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  redirect('/dashboard/analytics');
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect('/auth/sign-in');
}
