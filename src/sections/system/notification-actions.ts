'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { number } from '@/src/lib/format';
import type { NotificationDeleteResult, RetractResult } from '@/src/lib/types';

export type NotificationActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

/**
 * Takes one row out of one member's notification centre.
 *
 * Which also cancels a push quiet hours was still holding — the hourly tick
 * reads the row, and a row that has gone sends nothing. The answer says
 * which of the three it was, because "deleted" means something different
 * for a message that already rang.
 */
export async function deleteNotification(
  _previous: NotificationActionState,
  form: FormData,
): Promise<NotificationActionState> {
  const id = text(form, 'id');
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — this is somebody’s notification centre.' };

  const result = await adminWrite<NotificationDeleteResult>('DELETE', `/admin/notifications/${encodeURIComponent(id)}`, {
    reason,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/notifications');
  const { wasRead, wasPushed, cancelledPush } = result.data;
  return {
    ok: cancelledPush
      ? 'Gone, and the push it was waiting to send will never go.'
      : wasPushed
        ? 'Gone from the feed. The push had already been delivered, so that part cannot be taken back.'
        : wasRead
          ? 'Gone — they had already read it, so this is tidying rather than unsending.'
          : 'Gone before they saw it.',
  };
}

/**
 * Takes back as much of a broadcast as can be taken back.
 *
 * The rows nobody has opened; the ones already read are left alone. Both
 * counts are reported because "it was retracted" and "it was retracted from
 * the people who had not looked yet" are different sentences.
 */
export async function retractBroadcast(
  _previous: NotificationActionState,
  form: FormData,
): Promise<NotificationActionState> {
  const key = text(form, 'dedupeKey');
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — a retraction is a fleet-wide write.' };
  if (text(form, 'confirm') !== 'retract') return { error: 'Type retract to confirm.' };

  const result = await adminWrite<RetractResult>(
    'POST',
    `/admin/notifications/broadcasts/${encodeURIComponent(key)}/retract`,
    { reason, confirm: true },
  );
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/notifications');
  const { removed, leftBecauseRead, alreadyPushed } = result.data;
  return {
    ok: `${number(removed)} removed.${
      leftBecauseRead > 0 ? ` ${number(leftBecauseRead)} stayed — those members had already opened it.` : ''
    }${alreadyPushed > 0 ? ` ${number(alreadyPushed)} had already been pushed to a phone.` : ''}`,
  };
}
