'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { coins } from '@/src/lib/format';
import type { RescoreResult, VerdictResult } from '@/src/lib/types';

export type ActionState = { ok?: string; error?: string };

/**
 * The two verdicts (RULES A27, T7).
 *
 * **Confirmed** voids what the day was *holding* — coins already released are
 * a ledger entry, and a ledger is corrected by a compensating row, not by a
 * button in a review queue. **Dismissed** lets the day stand and gives back
 * the trust the open flag was costing.
 *
 * Neither rewrites the day. What the evidence showed stays as it was; the
 * verdict is our judgement about it.
 */
export async function decideFlag(_previous: ActionState, form: FormData): Promise<ActionState> {
  const flagId = String(form.get('flagId') ?? '');
  const userId = String(form.get('userId') ?? '');
  const verdict = String(form.get('verdict') ?? '');
  const note = String(form.get('note') ?? '').trim();

  if (!flagId || (verdict !== 'confirm' && verdict !== 'dismiss')) {
    return { error: 'That verdict could not be read. Try again.' };
  }

  const result = await adminWrite<VerdictResult>(
    'POST',
    `/admin/fraud/flags/${encodeURIComponent(flagId)}/${verdict}`,
    note ? { note } : {},
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(`/dashboard/users/${userId}/fraud`);

  const voided = result.data.voided.reduce((sum, hold) => sum + hold.amount, 0);
  const trust = result.data.trust;
  return {
    ok:
      verdict === 'confirm'
        ? `Confirmed. ${result.data.voided.length === 0 ? 'Nothing was in escrow to void' : `${coins(voided)} coins voided`}${trust ? `, trust now ${trust.score} (${trust.tier})` : ''}.`
        : `Dismissed. The day stands${trust ? `, trust now ${trust.score} (${trust.tier})` : ''}.`,
  };
}

/**
 * Scores a day again from the evidence already stored.
 *
 * What a threshold change would have done to a real day, without waiting for
 * that phone to send anything: the snapshots are kept per device-day, so the
 * layers can be run over them as often as the config moves. Nothing is
 * re-read from the phone, and nothing is credited that was not already owed.
 */
export async function rescoreDay(_previous: ActionState, form: FormData): Promise<ActionState> {
  const userId = String(form.get('userId') ?? '');
  const localDay = String(form.get('localDay') ?? '');
  if (!userId || !/^\d{4}-\d{2}-\d{2}$/.test(localDay)) return { error: 'That day could not be read.' };

  const result = await adminWrite<RescoreResult>(
    'POST',
    `/admin/users/${encodeURIComponent(userId)}/days/${localDay}/rescore`,
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(`/dashboard/users/${userId}/fraud`);

  const { before, after } = result.data;
  const moved = before.verifiedSteps !== after.verifiedSteps || before.verified !== after.verified;
  return {
    ok: moved
      ? `${localDay} re-scored: ${before.verified ? 'verified' : 'refused'} ${before.verifiedSteps ?? 0} → ${after.verified ? 'verified' : 'refused'} ${after.verifiedSteps ?? 0}.`
      : `${localDay} re-scored and came out the same: ${after.verified ? 'verified' : 'refused'}, ${after.verifiedSteps ?? 0} steps.`,
  };
}
