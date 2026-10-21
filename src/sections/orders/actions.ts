'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { coins as formatCoins, rupees } from '@/src/lib/format';
import type { AdvanceResult, CancelResult, OrderStatus, RefundResult } from '@/src/lib/types';

export type OrderActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

function revalidate(orderId: string, userId: string) {
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath('/dashboard/orders');
  if (userId) revalidatePath(`/dashboard/users/${userId}/orders`);
}

/** Moves it along: forwards only, and never out of a finished state. */
export async function advanceOrder(_previous: OrderActionState, form: FormData): Promise<OrderActionState> {
  const orderId = text(form, 'orderId');
  const status = text(form, 'status') as OrderStatus;
  const tracking = text(form, 'trackingRef');
  if (!status) return { error: 'Pick the step it has reached.' };

  const result = await adminWrite<AdvanceResult>('PUT', `/admin/orders/${encodeURIComponent(orderId)}/status`, {
    status,
    ...(tracking ? { trackingRef: tracking } : {}),
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  revalidate(orderId, text(form, 'userId'));
  return {
    ok: result.data.moved
      ? `Moved to ${result.data.status.replace(/_/g, ' ')}${
          result.data.status === 'shipped' || result.data.status === 'delivered' ? ' — the member has been told' : ''
        }.`
      : `It was already ${result.data.status.replace(/_/g, ' ')}${result.data.trackingRef ? `; the tracking reference is saved` : ''}.`,
  };
}

/**
 * Undoes it — the same path the member's own cancel takes, so the coins, the
 * stock, the coupon and the gateway refund all happen.
 */
export async function cancelOrder(_previous: OrderActionState, form: FormData): Promise<OrderActionState> {
  const orderId = text(form, 'orderId');
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — it goes on the order’s own history.' };

  const result = await adminWrite<CancelResult>('POST', `/admin/orders/${encodeURIComponent(orderId)}/cancel`, { reason });
  if (!result.ok) return { error: result.error };

  revalidate(orderId, text(form, 'userId'));
  const { data } = result;
  if (data.already) return { ok: 'That order was already cancelled; nothing moved.' };
  return {
    ok: [
      'Cancelled.',
      data.coinsReturned > 0 ? `${formatCoins(data.coinsReturned)} coins are back in their wallet.` : '',
      data.payment === 'refunded' ? 'The payment is being refunded.' : '',
      'Stock is back on the shelf.',
    ]
      .filter(Boolean)
      .join(' '),
  };
}

/**
 * Puts a finished order's money and coins back. Not a cancel: the stock is in
 * somebody's house, and this does not pretend otherwise.
 */
export async function refundOrder(_previous: OrderActionState, form: FormData): Promise<OrderActionState> {
  const orderId = text(form, 'orderId');
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — a refund is money, and the reason is kept.' };
  const amount = text(form, 'amount');

  const result = await adminWrite<RefundResult>('POST', `/admin/orders/${encodeURIComponent(orderId)}/refund`, {
    reason,
    ...(amount ? { amount: Math.round(Number(amount) * 100) } : {}),
  });
  if (!result.ok) return { error: result.error };

  revalidate(orderId, text(form, 'userId'));
  const { data } = result;
  return {
    ok: [
      'Refunded.',
      data.coinsReturned > 0 ? `${formatCoins(data.coinsReturned)} coins are back in their wallet.` : '',
      data.money === 'refunded'
        ? `${rupees(data.amount)} is on its way back through the gateway.`
        : data.money === 'failed'
          ? 'The gateway refused the money refund — the order is refunded and the payment still reads as paid. That mismatch needs chasing.'
          : '',
    ]
      .filter(Boolean)
      .join(' '),
  };
}

/** Corrects the address on the order's own snapshot — the typo case. */
export async function setOrderAddress(_previous: OrderActionState, form: FormData): Promise<OrderActionState> {
  const orderId = text(form, 'orderId');
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why the address is being changed.' };

  const body: Record<string, unknown> = { reason };
  for (const field of ['name', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode'] as const) {
    const value = text(form, field);
    if (value) body[field] = value;
  }
  if (Object.keys(body).length === 1) return { error: 'Nothing has changed.' };

  const result = await adminWrite<{ id: string; address: Record<string, string> }>(
    'PUT',
    `/admin/orders/${encodeURIComponent(orderId)}/address`,
    body,
  );
  if (!result.ok) return { error: result.error };

  revalidate(orderId, text(form, 'userId'));
  const address = result.data.address;
  return { ok: `Saved. Going to ${[address.line1, address.city, address.postalCode].filter(Boolean).join(', ')}. The member has been told.` };
}
