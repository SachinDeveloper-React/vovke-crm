'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { number } from '@/src/lib/format';
import type { MemberConfig, NotifyResult, NudgeResult } from '@/src/lib/types';

export type MemberActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

/** The last value of a switch's field — see `money-actions.ts` for why. */
const toggle = (form: FormData, key: string): boolean | undefined => {
  const values = form.getAll(key).map(String);
  if (values.length === 0) return undefined;
  return values[values.length - 1] === 'on';
};

function revalidate(userId: string) {
  revalidatePath(`/dashboard/users/${userId}/config`);
}

/**
 * The step goal and the timezone — the two things a member can get into a
 * state they cannot get out of themselves.
 */
export async function saveMemberSteps(_previous: MemberActionState, form: FormData): Promise<MemberActionState> {
  const userId = text(form, 'userId');
  const body: Record<string, unknown> = {};

  const goal = text(form, 'dailyStepGoal');
  if (goal) {
    const parsed = Number(goal);
    if (!Number.isFinite(parsed)) return { error: 'A goal is a number of steps.' };
    body.dailyStepGoal = Math.round(parsed);
  }
  const timezone = text(form, 'timezone');
  if (timezone) body.timezone = timezone;
  const note = text(form, 'note');
  if (note) body.note = note;

  if (Object.keys(body).length === 0) return { error: 'Nothing has changed.' };

  const result = await adminWrite<MemberConfig>('PUT', `/admin/users/${encodeURIComponent(userId)}/config`, body);
  if (!result.ok) return { error: result.error };

  revalidate(userId);
  const saved = result.data;
  return {
    ok: `Saved. Goal ${number(saved.steps.goal.current)} steps, days counted in ${saved.account.timezone}.`,
  };
}

/**
 * Silencing a category, and the quiet window.
 *
 * There is no way to turn a switch back on from here: the API has no shape
 * for it. "Stop sending me this" is support; "start sending them this" is
 * consent, and the member gives that in the app where they can see what
 * they are agreeing to.
 */
export async function saveMemberNotificationPrefs(
  _previous: MemberActionState,
  form: FormData,
): Promise<MemberActionState> {
  const userId = text(form, 'userId');
  const silence = form.getAll('silence').map(String).filter(Boolean);
  const body: Record<string, unknown> = {};
  if (silence.length > 0) body.silence = silence;

  const quiet: Record<string, unknown> = {};
  const enabled = toggle(form, 'quietEnabled');
  if (enabled !== undefined) quiet.enabled = enabled;
  const start = text(form, 'quietStart');
  const end = text(form, 'quietEnd');
  if (start) quiet.start = start;
  if (end) quiet.end = end;
  if (Object.keys(quiet).length > 0) body.quietHours = quiet;

  const note = text(form, 'note');
  if (note) body.note = note;
  if (Object.keys(body).length === 0) return { error: 'Nothing has changed.' };

  const result = await adminWrite<MemberConfig>('PUT', `/admin/users/${encodeURIComponent(userId)}/config`, body);
  if (!result.ok) return { error: result.error };

  revalidate(userId);
  const off = Object.entries(result.data.notifications.preferences.categories)
    .filter(([, on]) => !on)
    .map(([name]) => name);
  return {
    ok: `Saved. ${off.length === 0 ? 'Every category is still on' : `Silenced: ${off.join(', ')}`}. Quiet hours ${
      result.data.notifications.preferences.quietHours.enabled
        ? `${result.data.notifications.preferences.quietHours.start}–${result.data.notifications.preferences.quietHours.end}`
        : 'off'
    }.`,
  };
}

/** Tells them something, through the same path every job uses. */
export async function sendMemberMessage(_previous: MemberActionState, form: FormData): Promise<MemberActionState> {
  const userId = text(form, 'userId');
  const body = {
    topic: text(form, 'topic') || 'system',
    title: text(form, 'title'),
    message: text(form, 'message'),
    exemptFromQuietHours: form.get('exemptFromQuietHours') === 'on',
    suppressPush: form.get('suppressPush') === 'on',
    note: text(form, 'note') || undefined,
  };
  if (!body.title || !body.message) return { error: 'A title and a message, both.' };

  const result = await adminWrite<NotifyResult>('POST', `/admin/users/${encodeURIComponent(userId)}/notifications`, body);
  if (!result.ok) return { error: result.error };

  revalidate(userId);
  const push = {
    sent: 'pushed to their phone',
    deferred: 'held until their quiet hours end',
    no_provider: 'not pushed — no push provider is configured on the API',
    category_off: 'not pushed — they have that category switched off',
    no_device: 'not pushed — no phone on the account can receive one',
    not_permitted: 'not pushed — the OS refuses notifications on their phones',
    skipped: 'no push was attempted',
    local: 'the phone rings for this one itself',
  }[result.data.push];

  return {
    ok:
      result.data.status === 'duplicate'
        ? 'That exact message was already in their feed; nothing was sent twice.'
        : result.data.status === 'suppressed'
          ? 'Not written: this member has opted out of targeted messages.'
          : `In their notification centre, and ${push}.`,
  };
}

/** The silent "sync now" push, sent to this member's phones at once. */
export async function nudgeMemberSteps(_previous: MemberActionState, form: FormData): Promise<MemberActionState> {
  const userId = text(form, 'userId');
  const result = await adminWrite<NudgeResult>('POST', `/admin/users/${encodeURIComponent(userId)}/sync-nudge`, {
    remind: form.get('remind') === 'on',
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  revalidate(userId);
  const { pushed, results, reminded } = result.data;
  const trouble = results.filter(row => row.outcome !== 'pushed');
  return {
    ok: [
      pushed > 0 ? `Sync asked for on ${pushed} phone${pushed === 1 ? '' : 's'}.` : 'No phone could be asked.',
      trouble.length > 0 ? `${trouble.map(row => `${row.label}: ${row.outcome.replace(/_/g, ' ')}`).join('; ')}.` : '',
      reminded === 'created' ? 'They have also been told in words.' : reminded === 'duplicate' ? 'They were already told today.' : '',
    ]
      .filter(Boolean)
      .join(' '),
  };
}
