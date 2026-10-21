'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { number, rupees } from '@/src/lib/format';
import type { BasketDetail } from '@/src/lib/types';

export type BasketActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

function refresh(userId: string): void {
  revalidatePath('/dashboard/baskets');
  revalidatePath(`/dashboard/users/${encodeURIComponent(userId)}/basket`);
}

const said = (detail: BasketDetail): string =>
  detail.basket.lines.length === 0
    ? 'Their basket is empty now.'
    : `${number(detail.basket.lines.length)} line(s) left, ${rupees(detail.basket.value)} at today’s prices.`;

/**
 * Takes one line out of somebody's basket.
 *
 * Through the member's own cart path, so a basket an operator touched is
 * left in exactly the shape the app would have left it in. The size and
 * colour are part of the target: a basket can hold one item twice at two
 * sizes, and they are different lines.
 */
export async function removeBasketLine(
  _previous: BasketActionState,
  form: FormData,
): Promise<BasketActionState> {
  const userId = text(form, 'userId');
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — this is somebody else’s basket.' };

  const result = await adminWrite<BasketDetail>('DELETE', `/admin/users/${encodeURIComponent(userId)}/basket/lines`, {
    itemId: text(form, 'itemId'),
    size: text(form, 'size') || null,
    color: text(form, 'color') || null,
    reason,
  });
  if (!result.ok) return { error: result.error };

  refresh(userId);
  return { ok: `${text(form, 'itemId')} is out. ${said(result.data)}` };
}

/** Empties it, coupon and all — the same call the checkout makes when it succeeds. */
export async function clearBasket(_previous: BasketActionState, form: FormData): Promise<BasketActionState> {
  const userId = text(form, 'userId');
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — emptying a basket is not undoable.' };

  const result = await adminWrite<BasketDetail>('DELETE', `/admin/users/${encodeURIComponent(userId)}/basket`, {
    reason,
  });
  if (!result.ok) return { error: result.error };

  refresh(userId);
  return { ok: 'Emptied, coupon and all.' };
}

/**
 * Takes the coupon off a basket.
 *
 * A basket keeps its code while it does not apply, so that it comes back
 * when the basket qualifies — right for somebody still shopping, wrong for
 * somebody stuck behind a campaign that has ended.
 */
export async function clearBasketCoupon(
  _previous: BasketActionState,
  form: FormData,
): Promise<BasketActionState> {
  const userId = text(form, 'userId');
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — the audit row is the only record of this.' };

  const result = await adminWrite<BasketDetail>('DELETE', `/admin/users/${encodeURIComponent(userId)}/basket/coupon`, {
    reason,
  });
  if (!result.ok) return { error: result.error };

  refresh(userId);
  return { ok: 'The code is off their basket.' };
}

/** Unsaves an item for somebody. */
export async function removeWishlistEntry(
  _previous: BasketActionState,
  form: FormData,
): Promise<BasketActionState> {
  const userId = text(form, 'userId');
  const itemId = text(form, 'itemId');
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — this is their own saved list.' };

  const result = await adminWrite<BasketDetail>(
    'DELETE',
    `/admin/users/${encodeURIComponent(userId)}/wishlist/${encodeURIComponent(itemId)}`,
    { reason },
  );
  if (!result.ok) return { error: result.error };

  refresh(userId);
  return { ok: `${itemId} is off their saved list — ${number(result.data.wishlist.length)} left.` };
}
