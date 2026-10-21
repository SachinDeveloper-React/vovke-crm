'use server';

import { revalidatePath } from 'next/cache';

import { ADMIN_TIMEZONE, adminWrite } from '@/src/lib/api';
import { instantFromLocalInput, number, rupees } from '@/src/lib/format';
import type { CouponDeleteResult, CouponDetail } from '@/src/lib/types';

export type CouponActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

/** The last value wins: a hidden `off` sits ahead of each switch. */
const toggle = (form: FormData, key: string): boolean => form.getAll(key).map(String).pop() === 'on';

/** Rupees in the form, paise on the wire — every figure the API holds is paise. */
const paise = (form: FormData, key: string): number | undefined => {
  const raw = text(form, key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.round(value * 100) : undefined;
};

const whole = (form: FormData, key: string): number | undefined => {
  const raw = text(form, key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.round(value) : undefined;
};

/**
 * A date the API will parse, from the `datetime-local` input.
 *
 * The input gives `2026-11-01T00:00` with no zone, which `Date.parse` reads
 * in the *browser's* zone — except this runs on the server, where that is
 * the server's zone. So it is turned into an instant here, where the panel's
 * own zone is known, rather than being passed through as a naive string.
 */
const instant = (form: FormData, key: string): string | null => {
  const raw = text(form, key);
  return raw ? instantFromLocalInput(raw, ADMIN_TIMEZONE) : null;
};

/** What a coupon takes off, said the way the operator typed it in. */
function worth(coupon: CouponDetail['coupon']): string {
  if (coupon.kind === 'percent') {
    return `${coupon.value}% off${coupon.maxDiscount ? `, up to ${rupees(coupon.maxDiscount)}` : ''}`;
  }
  return `${rupees(coupon.value)} off`;
}

function said(detail: CouponDetail, verb: string): string {
  const { coupon } = detail;
  const ceiling = coupon.maxRedemptions === null ? 'no limit' : `${number(coupon.remaining ?? 0)} of ${number(coupon.maxRedemptions)} left`;
  return `${verb} ${coupon.code}: ${worth(coupon)} on orders over ${rupees(coupon.minSubtotal)} · ${ceiling} · ${coupon.state}.`;
}

/**
 * Creates a coupon, or rewrites the one with that code.
 *
 * The code is upper-cased by the API, which is how the till looks one up: a
 * coupon stored lower-case is a coupon no member can ever use.
 */
export async function saveCoupon(_previous: CouponActionState, form: FormData): Promise<CouponActionState> {
  const code = text(form, 'code').toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code)) {
    return { error: 'A code looks like SUMMER10 — letters, numbers, - or _, at least three characters.' };
  }
  const title = text(form, 'title');
  if (!title) return { error: 'It needs a title — that is the line the member reads on their basket.' };

  const kind = text(form, 'kind') === 'flat' ? 'flat' : 'percent';
  // A percent is a percent; a flat amount is money, so it arrives in rupees.
  const value = kind === 'percent' ? whole(form, 'percentValue') : paise(form, 'flatValue');
  if (!value || value < 1) {
    return { error: kind === 'percent' ? 'How many percent off? 1–100.' : 'How much off, in rupees?' };
  }

  const body: Record<string, unknown> = {
    code,
    title,
    kind,
    value,
    // A cap belongs to a percent coupon alone — on a flat one the till would
    // apply it as well, quietly making ₹200 off into ₹50 off.
    maxDiscount: kind === 'percent' ? paise(form, 'maxDiscount') ?? null : null,
    minSubtotal: paise(form, 'minSubtotal') ?? 0,
    startsAt: instant(form, 'startsAt'),
    endsAt: instant(form, 'endsAt'),
    maxRedemptions: whole(form, 'maxRedemptions') ?? null,
    perUserLimit: whole(form, 'perUserLimit') ?? 1,
    active: toggle(form, 'active'),
    note: text(form, 'note') || undefined,
  };

  const result = await adminWrite<CouponDetail & { created?: boolean }>('POST', '/admin/shop/coupons', body);
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/coupons');
  revalidatePath(`/dashboard/coupons/${encodeURIComponent(code)}`);
  return { ok: said(result.data, result.data.created ? 'Created' : 'Saved') };
}

/** A patch, for the one field somebody came to change. */
export async function patchCoupon(_previous: CouponActionState, form: FormData): Promise<CouponActionState> {
  const code = text(form, 'code');
  const body: Record<string, unknown> = { note: text(form, 'note') || undefined };

  if (form.get('title') !== null) body.title = text(form, 'title');
  if (form.get('percentValue') !== null && text(form, 'percentValue')) body.value = whole(form, 'percentValue');
  if (form.get('flatValue') !== null && text(form, 'flatValue')) body.value = paise(form, 'flatValue');
  if (form.get('kind') !== null) body.kind = text(form, 'kind');
  if (form.get('maxDiscount') !== null) body.maxDiscount = paise(form, 'maxDiscount') ?? null;
  if (form.get('minSubtotal') !== null) body.minSubtotal = paise(form, 'minSubtotal') ?? 0;
  if (form.get('startsAt') !== null) body.startsAt = instant(form, 'startsAt');
  if (form.get('endsAt') !== null) body.endsAt = instant(form, 'endsAt');
  if (form.get('maxRedemptions') !== null) body.maxRedemptions = whole(form, 'maxRedemptions') ?? null;
  if (form.get('perUserLimit') !== null) body.perUserLimit = whole(form, 'perUserLimit') ?? 1;

  const result = await adminWrite<CouponDetail>('PUT', `/admin/shop/coupons/${encodeURIComponent(code)}`, body);
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/coupons');
  revalidatePath(`/dashboard/coupons/${encodeURIComponent(code)}`);
  return { ok: said(result.data, 'Saved') };
}

/**
 * Switches a campaign off, or back on.
 *
 * The ordinary way to end one: the till tests `active` first, so this stops
 * it applying everywhere at once while every order holding it, and every
 * usage row the per-member limit is counted from, stays as it was.
 */
export async function setCouponActive(_previous: CouponActionState, form: FormData): Promise<CouponActionState> {
  const code = text(form, 'code');
  const active = text(form, 'active') === 'true';
  const result = await adminWrite<CouponDetail>('PUT', `/admin/shop/coupons/${encodeURIComponent(code)}/active`, {
    active,
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/coupons');
  revalidatePath(`/dashboard/coupons/${encodeURIComponent(code)}`);
  return {
    ok: active
      ? `${code} is live again.`
      : `${code} is off — nothing can apply it, and the ${number(result.data.coupon.orders)} order(s) holding it are untouched.`,
  };
}

/**
 * Deletes a coupon nothing ever used.
 *
 * One that has been redeemed is refused by the API, and the refusal is the
 * message shown: an order holds its own snapshot of the coupon and the usage
 * rows are what the per-member limit is counted from.
 */
export async function deleteCoupon(_previous: CouponActionState, form: FormData): Promise<CouponActionState> {
  const code = text(form, 'code');
  if (text(form, 'confirm') !== code) {
    return { error: `Type ${code} to confirm — this cannot be undone.` };
  }
  const result = await adminWrite<CouponDeleteResult>('DELETE', `/admin/shop/coupons/${encodeURIComponent(code)}`, {
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/coupons');
  return {
    ok: `${code} is gone${result.data.basketsCleared > 0 ? `, and was taken off ${number(result.data.basketsCleared)} basket(s) holding it` : ''}.`,
  };
}
