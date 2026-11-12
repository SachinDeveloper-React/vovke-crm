'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { decimal, number } from '@/src/lib/format';
import type { ReviewDeleteResult, ReviewEditResult } from '@/src/lib/types';

export type ReviewActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

/**
 * Takes a review down.
 *
 * The reason is required by the API and kept in the audit trail: taking down
 * somebody's words is the kind of thing that gets asked about later. The
 * member can write another one — the unique index is on the pair, not on the
 * history — so this is a removal, not a ban.
 */
export async function deleteReview(_previous: ReviewActionState, form: FormData): Promise<ReviewActionState> {
  const id = text(form, 'id');
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — the audit row is the only record of this.' };

  const result = await adminWrite<ReviewDeleteResult>('DELETE', `/admin/shop/reviews/${encodeURIComponent(id)}`, {
    reason,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/reviews');
  revalidatePath(`/dashboard/catalogue/${encodeURIComponent(result.data.itemId)}`);
  const { rating } = result.data;
  return {
    ok: `Gone. ${result.data.itemId} now reads ${decimal(rating.average, 1)} from ${number(rating.count)} review(s).`,
  };
}

/**
 * Corrects a review in place — a phone number left in the text, the wrong
 * star pressed — where taking it down would remove the whole review for one
 * line. The words as they were are kept on the audit row.
 */
export async function editReview(_previous: ReviewActionState, form: FormData): Promise<ReviewActionState> {
  const id = text(form, 'id');
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — this changes what somebody else wrote, and the audit row is the record.' };
  const body = text(form, 'body');
  if (!body) return { error: 'The review needs some words. To remove it entirely, use Remove instead.' };
  const rating = Number(text(form, 'rating'));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'Stars are a whole number from 1 to 5.' };

  const result = await adminWrite<ReviewEditResult>('PUT', `/admin/shop/reviews/${encodeURIComponent(id)}`, {
    rating,
    title: text(form, 'title') || null,
    body,
    verified: form.getAll('verified').map(String).pop() === 'on',
    reason,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/reviews');
  revalidatePath(`/dashboard/catalogue/${encodeURIComponent(result.data.itemId)}`);
  const { rating: after, changed } = result.data;
  return {
    ok: `Saved (${changed.join(', ')}). ${result.data.itemId} reads ${decimal(after.average, 1)} from ${number(after.count)} review(s).`,
  };
}
