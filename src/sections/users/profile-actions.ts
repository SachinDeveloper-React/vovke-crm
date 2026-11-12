'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import type { ProfileResult } from '@/src/lib/types';

export type ProfileActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

/** An empty box is "no value" for the fields that can be empty, and a number otherwise. */
const decimalOrNull = (form: FormData, key: string): number | null | 'bad' => {
  const raw = text(form, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : 'bad';
};

const LABEL: Record<string, string> = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  avatarUrl: 'photo',
  heightCm: 'height',
  weightKg: 'weight',
  dateOfBirth: 'date of birth',
  gender: 'gender',
  goal: 'goal',
  activityLevel: 'activity level',
  units: 'units',
  weeklyGoalWorkouts: 'workouts a week',
  country: 'country',
};

/**
 * Corrects a member's profile.
 *
 * Every box is sent; the API writes only what differs and says which, so
 * the answer names the one field that moved rather than all thirteen. A new
 * email or number comes back unverified — "Mark verified" on the overview is
 * the separate step for one support has proven.
 */
export async function saveMemberProfile(
  _previous: ProfileActionState,
  form: FormData,
): Promise<ProfileActionState> {
  const userId = text(form, 'userId');
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — it is kept on the audit row, for whoever reads it next.' };

  const name = text(form, 'name');
  if (name.length < 2) return { error: 'A name is at least two letters.' };

  const heightCm = decimalOrNull(form, 'heightCm');
  const weightKg = decimalOrNull(form, 'weightKg');
  if (heightCm === 'bad' || weightKg === 'bad') return { error: 'Height and weight are numbers (cm and kg).' };
  const weekly = Number(text(form, 'weeklyGoalWorkouts'));

  const body: Record<string, unknown> = {
    name,
    email: text(form, 'email'),
    avatarUrl: text(form, 'avatarUrl') || null,
    heightCm,
    weightKg,
    dateOfBirth: text(form, 'dateOfBirth') || null,
    gender: text(form, 'gender') || null,
    goal: text(form, 'goal'),
    activityLevel: text(form, 'activityLevel'),
    units: text(form, 'units'),
    weeklyGoalWorkouts: Number.isFinite(weekly) ? Math.round(weekly) : undefined,
    country: text(form, 'country').toUpperCase(),
    reason,
  };
  // A Google account can have no number at all; an empty box leaves it alone
  // rather than trying to write an empty one.
  const phone = text(form, 'phone').replace(/[\s-]/g, '');
  if (phone) body.phone = phone;

  const result = await adminWrite<ProfileResult>('PUT', `/admin/users/${encodeURIComponent(userId)}/profile`, body);
  if (!result.ok) return { error: result.error };

  // The header is on every member tab, and the list shows the name.
  revalidatePath(`/dashboard/users/${userId}`, 'layout');
  revalidatePath('/dashboard/users');

  const { changed, profile } = result.data;
  const unproven = [
    changed.includes('email') && !profile.emailVerifiedAt ? 'the new email' : null,
    changed.includes('phone') && !profile.phoneVerifiedAt ? 'the new number' : null,
  ].filter(Boolean);
  return {
    ok: `Saved: ${changed.map(key => LABEL[key] ?? key).join(', ')}.${
      unproven.length ? ` ${unproven.join(' and ')} is unverified until they confirm it, or you mark it verified on Overview.` : ''
    }`,
  };
}
