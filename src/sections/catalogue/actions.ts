'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { coins, number, rupees } from '@/src/lib/format';
import type { CatalogueItemResult, ItemDeleteResult } from '@/src/lib/types';

export type CatalogueActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();
const lines = (form: FormData, key: string): string[] =>
  text(form, key)
    .split(/[\n,]/)
    .map(line => line.trim())
    .filter(Boolean);

/** Rupees in the form, paise on the wire — the API's figures are all paise. */
const paise = (form: FormData, key: string): number | undefined => {
  const raw = text(form, key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.round(value * 100) : undefined;
};

/**
 * The coin price, which is three states and not two: a figure, or null for
 * "divide the rupee price out at ⚙ `commerce.coinValuePaise`", which is
 * what an empty box means and what the till did before the box existed.
 */
const coinPriceOf = (form: FormData): number | null => {
  const raw = text(form, 'coinPrice');
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
};

/**
 * Creates an item, or rewrites the one with that slug.
 *
 * The slug is the id a basket line keys on, so it is fixed once the item
 * exists: renaming it would orphan every cart and order that points at it.
 */
export async function saveItem(_previous: CatalogueActionState, form: FormData): Promise<CatalogueActionState> {
  const id = text(form, 'id').toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,48}$/.test(id)) {
    return { error: 'The slug is lowercase letters, numbers and hyphens — like travel-bottle.' };
  }
  const price = paise(form, 'price');
  if (!price || price < 1) return { error: 'A price in rupees, above zero.' };

  const mode = text(form, 'paymentMode');
  const body: Record<string, unknown> = {
    id,
    title: text(form, 'title'),
    description: text(form, 'description') || undefined,
    price,
    coinPrice: coinPriceOf(form),
    mrp: paise(form, 'mrp') ?? null,
    category: text(form, 'category'),
    subcategory: text(form, 'subcategory') || null,
    // Empty means "follow the shop's own mode", which is a real choice and
    // not a missing one.
    paymentMode: mode === '' ? null : mode,
    emoji: text(form, 'emoji') || undefined,
    imageUrl: text(form, 'imageUrl') || null,
    badge: text(form, 'badge') || null,
    tags: lines(form, 'tags'),
    sizes: lines(form, 'sizes'),
    featured: form.getAll('featured').map(String).pop() === 'on',
    isDeal: form.getAll('isDeal').map(String).pop() === 'on',
    active: form.getAll('active').map(String).pop() === 'on',
    sort: Number(text(form, 'sort') || 0),
    note: text(form, 'note') || undefined,
  };
  const onHand = text(form, 'onHand');
  if (onHand) body.onHand = Number(onHand);
  const lowStockAt = text(form, 'lowStockAt');
  if (lowStockAt) body.lowStockAt = Number(lowStockAt);
  if (!body.title) return { error: 'It needs a title — that is what a member reads.' };

  const result = await adminWrite<CatalogueItemResult>('POST', '/admin/shop/items', body);
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/catalogue');
  revalidatePath('/dashboard/categories');
  const { item, created } = result.data;
  return {
    ok: `${created ? 'Listed' : 'Saved'} ${item.title} at ${rupees(item.price)} or ${coins(item.coinPrice)} coins · ${
      item.paymentMode ? `${item.paymentMode} only` : `the shop’s mode (${item.effectivePaymentMode})`
    } · ${number(item.stock.onHand)} in stock${item.active ? '' : ' · not on the shelf'}.`,
  };
}

/** The one field somebody came to change. */
export async function patchItem(_previous: CatalogueActionState, form: FormData): Promise<CatalogueActionState> {
  const id = text(form, 'id');
  const body: Record<string, unknown> = { note: text(form, 'note') || undefined };

  const price = paise(form, 'price');
  if (price !== undefined) body.price = price;
  const mode = form.get('paymentMode');
  if (mode !== null) body.paymentMode = String(mode) === '' ? null : String(mode);
  const onHand = text(form, 'onHand');
  if (onHand) body.onHand = Number(onHand);
  if (form.get('active') !== null) body.active = form.getAll('active').map(String).pop() === 'on';

  const result = await adminWrite<CatalogueItemResult>('PUT', `/admin/shop/items/${encodeURIComponent(id)}`, body);
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/catalogue');
  const { item } = result.data;
  return { ok: `${item.title}: ${rupees(item.price)}, ${number(item.stock.onHand)} in stock, ${item.active ? 'on the shelf' : 'retired'}.` };
}

/**
 * Takes it off the shelf, or puts it back. Never a delete: every order that
 * holds it stays readable, and a basket pointing at a row that has gone is a
 * broken basket.
 */
export async function retireItem(_previous: CatalogueActionState, form: FormData): Promise<CatalogueActionState> {
  const id = text(form, 'id');
  const active = text(form, 'active') === 'true';
  const result = await adminWrite<CatalogueItemResult>('DELETE', `/admin/shop/items/${encodeURIComponent(id)}`, {
    active,
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/catalogue');
  return { ok: active ? `${result.data.item.title} is back on the shelf.` : `${result.data.item.title} is off the shelf — its orders are untouched.` };
}

/** Stock, the other half of an order going wrong. */
export async function setStock(_previous: CatalogueActionState, form: FormData): Promise<CatalogueActionState> {
  const id = text(form, 'id');
  const onHand = Number(text(form, 'onHand'));
  if (!Number.isFinite(onHand) || onHand < 0) return { error: 'How many are on the shelf? A whole number.' };
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — a stock count is evidence.' };

  const result = await adminWrite<{ itemId: string; onHand: number; lowStockAt: number }>(
    'PUT',
    `/admin/shop/items/${encodeURIComponent(id)}/stock`,
    { onHand, reason, ...(text(form, 'lowStockAt') ? { lowStockAt: Number(text(form, 'lowStockAt')) } : {}) },
  );
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/catalogue');
  return { ok: `${number(result.data.onHand)} on the shelf, low below ${number(result.data.lowStockAt)}.` };
}

// ─── One product, every field ──────────────────────────────────────────────

/** One per line, blanks dropped — a textarea holding a list. */
const rows = (form: FormData, key: string): string[] =>
  text(form, key)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

/**
 * A list of small records, one per line, fields separated by `|`.
 *
 * The product page's facts — highlights, features, specs, colours — are
 * arrays of two or three short strings each. A repeating field editor for
 * them would be several hundred lines of client state to type what a
 * textarea types in one; `Fabric | Dry Fit Polyester` is also the shape
 * somebody can paste in from a spreadsheet.
 */
function records(form: FormData, key: string, fields: string[]): Record<string, string>[] | { error: string } {
  const out: Record<string, string>[] = [];
  for (const [index, line] of rows(form, key).entries()) {
    const parts = line.split('|').map(part => part.trim());
    if (parts.length !== fields.length || parts.some(part => part.length === 0)) {
      return {
        error: `${key}, line ${index + 1}: write it as ${fields.join(' | ')} — ${fields.length} parts, none empty.`,
      };
    }
    out.push(Object.fromEntries(fields.map((field, at) => [field, parts[at]])));
  }
  return out;
}

const failed = (value: unknown): value is { error: string } =>
  Boolean(value) && typeof value === 'object' && 'error' in (value as object);

/**
 * Saves every field of one product.
 *
 * A patch rather than the upsert the list page's quick form uses: this form
 * carries the whole item, and a `POST` with a field the form happens not to
 * hold would clear it. The slug is never in it — baskets and orders key on
 * it, so renaming one would orphan them.
 */
export async function saveProduct(_previous: CatalogueActionState, form: FormData): Promise<CatalogueActionState> {
  const id = text(form, 'id');
  if (!id) return { error: 'Which item? The slug is missing.' };

  const price = paise(form, 'price');
  if (!price || price < 1) return { error: 'A price in rupees, above zero.' };

  const colors = records(form, 'colors', ['name', 'hex']);
  if (failed(colors)) return { error: colors.error };
  const highlights = records(form, 'highlights', ['label', 'value']);
  if (failed(highlights)) return { error: highlights.error };
  const features = records(form, 'features', ['title', 'caption']);
  if (failed(features)) return { error: features.error };
  const specs = records(form, 'specs', ['label', 'value']);
  if (failed(specs)) return { error: specs.error };

  const mode = text(form, 'paymentMode');
  const images = rows(form, 'images');
  const body: Record<string, unknown> = {
    title: text(form, 'title'),
    description: text(form, 'description'),
    price,
    coinPrice: coinPriceOf(form),
    mrp: paise(form, 'mrp') ?? null,
    category: text(form, 'category'),
    subcategory: text(form, 'subcategory') || null,
    // Empty is a real choice: follow the shop's own mode.
    paymentMode: mode === '' ? null : mode,
    emoji: text(form, 'emoji') || undefined,
    // The cover photo is the first of the gallery, and `imageUrl` is the
    // older single field the app still reads as a one-photo gallery.
    imageUrl: images[0] ?? (text(form, 'imageUrl') || null),
    images,
    badge: text(form, 'badge') || null,
    ribbon: text(form, 'ribbon') || null,
    tags: lines(form, 'tags'),
    sizes: lines(form, 'sizes'),
    colors,
    highlights,
    features,
    specs,
    featured: form.getAll('featured').map(String).pop() === 'on',
    isDeal: form.getAll('isDeal').map(String).pop() === 'on',
    active: form.getAll('active').map(String).pop() === 'on',
    sort: Number(text(form, 'sort') || 0),
    note: text(form, 'note') || undefined,
  };
  if (!body.title) return { error: 'It needs a title — that is what a member reads.' };

  const result = await adminWrite<CatalogueItemResult>('PUT', `/admin/shop/items/${encodeURIComponent(id)}`, body);
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/catalogue');
  revalidatePath('/dashboard/categories');
  revalidatePath(`/dashboard/catalogue/${encodeURIComponent(id)}`);
  const { item } = result.data;
  return {
    ok: `Saved ${item.title}: ${rupees(item.price)} or ${coins(item.coinPrice)} coins · ${
      item.paymentMode ? `${item.paymentMode} only` : `the shop’s mode (${item.effectivePaymentMode})`
    } · ${item.images.length} photo(s) · ${item.active ? 'on the shelf' : 'retired'}.`,
  };
}

/**
 * Deletes a product outright.
 *
 * Only for the mistake case — a slug typed wrong, a draft listed by
 * accident. The API refuses any item an order holds, because that would
 * break the link support follows from an order back to the product, and the
 * refusal is the message shown here. Typing the slug is the confirmation.
 */
export async function deleteProduct(_previous: CatalogueActionState, form: FormData): Promise<CatalogueActionState> {
  const id = text(form, 'id');
  if (text(form, 'confirm') !== id) {
    return { error: `Type ${id} to confirm — this cannot be undone.` };
  }
  const result = await adminWrite<ItemDeleteResult>(
    'DELETE',
    `/admin/shop/items/${encodeURIComponent(id)}/permanent`,
    { note: text(form, 'note') || undefined },
  );
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/catalogue');
  const { basketsTidied, savesRemoved, reviewsRemoved } = result.data;
  const tidied = [
    basketsTidied > 0 ? `${number(basketsTidied)} basket(s)` : null,
    savesRemoved > 0 ? `${number(savesRemoved)} save(s)` : null,
    reviewsRemoved > 0 ? `${number(reviewsRemoved)} review(s)` : null,
  ].filter(Boolean);
  // Deliberately not a redirect: what was tidied up is worth reading, and a
  // redirect would replace it with a list. The form shows the way back.
  return { ok: `${id} is gone${tidied.length > 0 ? `, and took ${tidied.join(', ')} with it` : ''}.` };
}
