'use server';

import { revalidatePath } from 'next/cache';

import { paths } from '@/src/layout/paths';
import { adminGet, adminWrite } from '@/src/lib/api';
import type { MemberSteps, NudgeResult } from '@/src/lib/types';

export type AskState = { result?: NudgeResult; error?: string };

/**
 * Ask this member's phones for their steps, now.
 *
 * The push itself is the hourly job's (RULES A28): a silent data message the
 * app answers by uploading what it has counted. Nothing rings on the phone
 * and nothing lands in the member's feed — an operator checking a figure is
 * not a reason to interrupt somebody's evening.
 *
 * What the server can promise ends at the provider: a phone that is force
 * stopped, out of battery, or off the network will not answer, and no amount
 * of asking changes that. So this returns what happened to each install
 * rather than a yes, and the panel waits for the upload to say the rest.
 */
export async function askForSteps(_previous: AskState, form: FormData): Promise<AskState> {
  const userId = String(form.get('userId') ?? '').trim();
  if (!userId) return { error: 'No member to ask.' };

  // The second rung of the job, offered here too: a member whose phone never
  // answers has to be told in words, and the audit row records which it was.
  const remind = form.getAll('remind').map(String).at(-1) === 'on';

  const sent = await adminWrite<NudgeResult>('POST', `/admin/users/${encodeURIComponent(userId)}/sync-nudge`, {
    remind,
  });
  if (!sent.ok) return { error: sent.error };

  revalidatePath(paths.dashboard.users.steps(userId));
  return { result: sent.data };
}

export interface FreshSteps {
  /** The member's own local day the figure belongs to. */
  localDay: string | null;
  steps: number | null;
  verifiedSteps: number | null;
  /** When the phone sent it, which is not when it was walked. */
  syncedAt: string | null;
}

/**
 * The newest step figure this member's phones have sent, read again.
 *
 * Called on a timer by the panel after it asks, because the answer to "did
 * the phone hear us" is not in the push receipt — it is in a snapshot
 * arriving a few seconds later. `syncedAt` is what moves when one does.
 */
export async function readFreshSteps(userId: string): Promise<FreshSteps> {
  const report = await adminGet<MemberSteps>(`/admin/users/${encodeURIComponent(userId)}/steps`, { days: 1 });
  const last = report.last;
  return {
    localDay: last?.localDay ?? null,
    steps: last?.steps ?? null,
    verifiedSteps: last?.verifiedSteps ?? null,
    syncedAt: last?.syncedAt ?? null,
  };
}
