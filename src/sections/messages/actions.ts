'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { number } from '@/src/lib/format';
import type { BroadcastResult } from '@/src/lib/types';

export type BroadcastState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

/**
 * Tells a segment something.
 *
 * The count the operator read is sent with it: the API refuses the send if
 * the segment has moved by more than a tenth since, so a filter typed wrong
 * is caught by the number on screen rather than by the apology afterwards.
 */
export async function sendBroadcast(_previous: BroadcastState, form: FormData): Promise<BroadcastState> {
  const title = text(form, 'title');
  const message = text(form, 'message');
  const reason = text(form, 'reason');
  if (!title || !message) return { error: 'A title and a message, both.' };
  if (reason.length < 3) return { error: 'Say why this is going out. It is kept on the audit row.' };
  if (form.get('confirm') !== 'on') return { error: 'Tick the confirmation: this cannot be taken back.' };

  const segment: Record<string, unknown> = {};
  for (const key of ['tier', 'platform'] as const) {
    const value = text(form, key);
    if (value) segment[key] = value;
  }
  for (const key of ['seenWithinDays', 'notSeenForDays'] as const) {
    const value = text(form, key);
    if (value) segment[key] = Number(value);
  }
  if (text(form, 'pushableOnly') === 'on') segment.pushableOnly = true;

  const result = await adminWrite<BroadcastResult>('POST', '/admin/notifications/broadcast', {
    segment,
    topic: text(form, 'topic') || 'system',
    // Left out, the topic's own switch governs the push, as it does for
    // every job. Named, it overrides — which is the only way `offers` ever
    // silences anything, since no topic maps to it.
    ...(text(form, 'preference') ? { preference: text(form, 'preference') } : {}),
    title,
    message,
    suppressPush: form.getAll('suppressPush').map(String).pop() === 'on',
    expected: Number(text(form, 'expected') || 0),
    confirm: true,
    reason,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/messages');
  const { data } = result;
  return {
    ok: [
      `Sent to ${number(data.recipients)} member${data.recipients === 1 ? '' : 's'}:`,
      `${number(data.created)} notification${data.created === 1 ? '' : 's'} written`,
      data.pushed > 0 ? `${number(data.pushed)} pushed` : '',
      data.deferred > 0 ? `${number(data.deferred)} held for quiet hours` : '',
      data.notPushed > 0 ? `${number(data.notPushed)} not pushed (switched off, no phone, or no provider)` : '',
      data.duplicate > 0 ? `${number(data.duplicate)} already had it` : '',
    ]
      .filter(Boolean)
      .join(' · '),
  };
}
