'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { decimal, number } from '@/src/lib/format';
import type { ReviewDeleteResult } from '@/src/lib/types';

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
