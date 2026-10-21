'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { coins, number } from '@/src/lib/format';
import type {
  AchievementDeleteResult,
  AchievementResult,
  ChallengeDeleteResult,
  ChallengeResult,
} from '@/src/lib/types';

export type GamificationActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();
const flag = (form: FormData, key: string): boolean => form.getAll(key).map(String).pop() === 'on';
const whole = (form: FormData, key: string): number | undefined => {
  const raw = text(form, key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.round(value) : undefined;
};

/** Both pages read each other's rows: a challenge names a badge, and a badge lists its challenges. */
function changed(): void {
  revalidatePath('/dashboard/challenges');
  revalidatePath('/dashboard/achievements');
}

// ─── Challenges (RULES C1–C5) ──────────────────────────────────────────────

/**
 * Writes a challenge, new or changed.
 *
 * One action for both, because the form is the same form: the id is the
 * only field that behaves differently, and it is sent only when creating —
 * every completion row keys on it, so it is fixed afterwards.
 */
export async function saveChallenge(
  _previous: GamificationActionState,
  form: FormData,
): Promise<GamificationActionState> {
  const id = text(form, 'id');
  const title = text(form, 'title');
  if (!title) return { error: 'What is the challenge called? That is what a member reads.' };

  const goal = whole(form, 'goal');
  if (!goal || goal < 1) return { error: 'What does finishing it take? A whole number, above zero.' };
  const rewardCoins = whole(form, 'rewardCoins') ?? 0;

  const rewardsBadge = flag(form, 'rewardsBadge');
  const badgeId = text(form, 'badgeId');
  if (rewardsBadge && !badgeId) return { error: 'A challenge that awards a badge has to say which badge.' };

  const body: Record<string, unknown> = {
    title,
    description: text(form, 'description'),
    emoji: text(form, 'emoji') || undefined,
    metric: text(form, 'metric'),
    cadence: text(form, 'cadence'),
    goal,
    rewardCoins,
    rewardsBadge,
    badgeId: rewardsBadge ? badgeId : null,
    startsOn: text(form, 'startsOn') || null,
    endsOn: text(form, 'endsOn') || null,
    active: flag(form, 'active'),
    sort: whole(form, 'sort') ?? 0,
    note: text(form, 'note') || undefined,
  };

  const result = id
    ? await adminWrite<ChallengeResult>('PUT', `/admin/challenges/${encodeURIComponent(id)}`, body)
    : await adminWrite<ChallengeResult>('POST', '/admin/challenges', {
        ...body,
        ...(text(form, 'slug') ? { id: text(form, 'slug') } : {}),
      });
  if (!result.ok) return { error: result.error };

  changed();
  const { challenge } = result.data;
  return {
    ok: `${id ? 'Saved' : 'Added'} ${challenge.title}: ${number(challenge.goal)} ${challenge.metric} ${
      challenge.cadence
    } for ${coins(challenge.rewardCoins)} coins${challenge.badgeLabel ? ` and the ${challenge.badgeLabel} badge` : ''} — ${
      challenge.state
    }.`,
  };
}

/** Takes it off every member's board, or puts it back. The completions stay readable. */
export async function setChallengeActive(
  _previous: GamificationActionState,
  form: FormData,
): Promise<GamificationActionState> {
  const id = text(form, 'id');
  const active = text(form, 'active') === 'true';

  const result = await adminWrite<ChallengeResult>('DELETE', `/admin/challenges/${encodeURIComponent(id)}`, {
    active,
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  changed();
  return {
    ok: active
      ? `${result.data.challenge.title} is back on the board.`
      : `${result.data.challenge.title} is off the board — what it has already paid is untouched.`,
  };
}

/**
 * Deletes one outright.
 *
 * The API refuses any challenge somebody has finished: a completion row is
 * what paid their coins. Typing the id is the confirmation, as it is
 * everywhere else here that cannot be undone.
 */
export async function deleteChallenge(
  _previous: GamificationActionState,
  form: FormData,
): Promise<GamificationActionState> {
  const id = text(form, 'id');
  if (text(form, 'confirm') !== id) return { error: `Type ${id} to confirm — this cannot be undone.` };

  const result = await adminWrite<ChallengeDeleteResult>('DELETE', `/admin/challenges/${encodeURIComponent(id)}/permanent`, {
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  changed();
  return { ok: `${id} is gone. ${number(result.data.totals.challenges)} challenge(s) left.` };
}

// ─── Achievements (RULES C7) ───────────────────────────────────────────────

/** Writes a badge, new or changed. The id is fixed once members start holding it. */
export async function saveAchievement(
  _previous: GamificationActionState,
  form: FormData,
): Promise<GamificationActionState> {
  const id = text(form, 'id');
  const label = text(form, 'label');
  if (!label) return { error: 'What does the badge say? That is the name on the tile.' };

  const value = whole(form, 'value');
  if (value === undefined) return { error: 'What figure does it stand for — 10,000 steps, 7 days?' };

  const rule = text(form, 'rule');
  const threshold = whole(form, 'threshold');
  const body: Record<string, unknown> = {
    label,
    title: text(form, 'title'),
    value,
    metric: text(form, 'metric'),
    rule: rule || null,
    threshold: rule ? (threshold ?? value) : null,
    rewardCoins: whole(form, 'rewardCoins') ?? 0,
    sort: whole(form, 'sort') ?? 0,
    note: text(form, 'note') || undefined,
  };

  const result = id
    ? await adminWrite<AchievementResult>('PUT', `/admin/achievements/${encodeURIComponent(id)}`, body)
    : await adminWrite<AchievementResult>('POST', '/admin/achievements', {
        ...body,
        ...(text(form, 'slug') ? { id: text(form, 'slug') } : {}),
      });
  if (!result.ok) return { error: result.error };

  changed();
  const { achievement } = result.data;
  return {
    ok: `${id ? 'Saved' : 'Added'} ${achievement.label}${
      achievement.rewardCoins > 0 ? `, worth ${coins(achievement.rewardCoins)} coins` : ''
    }${achievement.unreachable ? ' — nothing unlocks it yet: give it a rule, or point a challenge at it.' : '.'}`,
  };
}

/**
 * Deletes a badge.
 *
 * Refused while anybody holds it — a badge is unlocked once and never taken
 * back — and while a challenge still awards it. Both refusals come back
 * from the API with the count or the challenge's name in them.
 */
export async function deleteAchievement(
  _previous: GamificationActionState,
  form: FormData,
): Promise<GamificationActionState> {
  const id = text(form, 'id');
  if (text(form, 'confirm') !== id) return { error: `Type ${id} to confirm — this cannot be undone.` };

  const result = await adminWrite<AchievementDeleteResult>('DELETE', `/admin/achievements/${encodeURIComponent(id)}`, {
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  changed();
  return { ok: `${id} is gone. ${number(result.data.totals.achievements)} badge(s) left.` };
}
