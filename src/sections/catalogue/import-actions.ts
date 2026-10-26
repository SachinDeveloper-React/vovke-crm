'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { number } from '@/src/lib/format';
import { pick, readSheet, SheetError, type SheetRow } from '@/src/lib/spreadsheet';
import type { ItemImportResult } from '@/src/lib/types';

/**
 * The catalogue from a spreadsheet.
 *
 * The same two-press shape as the food library's import (RULES N8) and for
 * the same reason, only more so: the shelf is what every member sees, and a
 * sheet's columns are whatever somebody typed. **Check the sheet** maps the
 * file and asks the API what it *would* do, writing nothing; **Import it**
 * does it.
 *
 * Rows are matched by **slug** — the id column where there is one, otherwise
 * one derived from the title — so the same sheet imported next month
 * corrects the products it created rather than listing each of them twice.
 *
 * Rupees in the sheet, paise on the wire: the API's figures are all paise
 * and the panel is the only place rupees are written, which is as true of an
 * imported column as it is of the form next door.
 */

export type ImportActionState = {
  ok?: string;
  error?: string;
  report?: {
    dryRun: boolean;
    file: string;
    sheet: string;
    headers: string[];
    rows: number;
    created: number;
    updated: number;
    duplicates: number;
    failed: { line: number | null; title: string; reason: string }[];
  };
};

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

/**
 * The column names a product sheet in the wild actually uses.
 *
 * Matched case-, space- and punctuation-insensitively, first one found
 * wins. The point is that an operator exports what they have and presses
 * the button, rather than renaming headers to match a format nobody wrote
 * down.
 */
const COLUMNS = {
  id: ['id', 'slug', 'sku', 'code', 'product id', 'item code'],
  title: ['title', 'name', 'product', 'product name', 'item', 'item name'],
  description: ['description', 'details', 'about', 'long description', 'summary'],
  price: ['price', 'price inr', 'price rs', 'selling price', 'sale price', 'our price', 'rate'],
  mrp: ['mrp', 'list price', 'original price', 'strike price', 'compare at price', 'market price'],
  coinPrice: ['coin price', 'coins', 'coin cost', 'price in coins', 'coins price'],
  category: ['category', 'shelf', 'collection', 'department'],
  subcategory: ['subcategory', 'sub category', 'sub shelf', 'type', 'subtype'],
  paymentMode: ['payment mode', 'pay with', 'payment', 'buy with', 'pay by'],
  emoji: ['emoji', 'icon'],
  imageUrl: ['image', 'image url', 'photo', 'thumbnail', 'main image'],
  images: ['images', 'gallery', 'image urls', 'more images', 'other images'],
  badge: ['badge', 'tag line', 'flag'],
  ribbon: ['ribbon', 'ribbon text', 'strip'],
  isDeal: ['deal', 'is deal', 'on deal', 'offer'],
  featured: ['featured', 'feature', 'highlight', 'home'],
  tags: ['tags', 'keywords', 'search terms'],
  sizes: ['sizes', 'size'],
  colors: ['colors', 'colours', 'color', 'colour'],
  sort: ['sort', 'order', 'position', 'rank'],
  active: ['active', 'enabled', 'live', 'published', 'on shelf'],
  onHand: ['stock', 'on hand', 'onhand', 'quantity', 'qty', 'inventory', 'units'],
  lowStockAt: ['low stock at', 'low stock', 'reorder at', 'low', 'reorder level'],
} as const;

/** The four badges the app can draw; anything else would be a blank chip. */
const BADGES = ['bestseller', 'popular', 'new_arrival', 'limited'] as const;

/**
 * A cell as a number.
 *
 * Sheets carry units and separators in the cell — "₹1,299.00", "4 kg",
 * "1 040" — and refusing those would send somebody back to clean a file
 * that is perfectly readable.
 */
function figure(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[,\s]/g, '').replace(/[^\d.-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** "yes", "TRUE", "1", "y" — the things a spreadsheet means by a tick. */
function truth(raw: string): boolean | undefined {
  const value = raw.trim().toLowerCase();
  if (value === '') return undefined;
  if (['no', 'n', 'false', '0', 'off', '-'].includes(value)) return false;
  return ['yes', 'y', 'true', '1', 'on', 'x', '✓', 'active', 'live'].includes(value);
}

/** A list cell: "red | blue", "red, blue", or one per line. */
function list(raw: string, limit: number): string[] {
  return raw
    .split(/[|\n;]|,(?![^(]*\))/)
    .map(part => part.trim())
    .filter(Boolean)
    .slice(0, limit);
}

/** "Black #111111" → `{ name, hex }`; a bare name gets no swatch and is skipped. */
function colours(raw: string): { name: string; hex: string }[] {
  return list(raw, 20)
    .map(part => {
      const match = /^(.*?)[\s:(]*#?([0-9a-fA-F]{3,8})\)?$/.exec(part.trim());
      if (!match) return null;
      const name = match[1].trim().replace(/[:(]$/, '').trim();
      if (!name) return null;
      return { name: name.slice(0, 40), hex: `#${match[2]}` };
    })
    .filter((colour): colour is { name: string; hex: string } => colour !== null);
}

/** What the sheet means by how a thing may be paid for. */
function payment(raw: string): 'coins' | 'money' | 'mixed' | null | undefined {
  const value = raw.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (value === '') return undefined;
  if (['coins', 'coin', 'coinsonly', 'reward', 'rewards'].includes(value)) return 'coins';
  if (['money', 'cash', 'rupees', 'inr', 'moneyonly', 'paid'].includes(value)) return 'money';
  if (['mixed', 'both', 'coinsmoney', 'coinsandmoney', 'part', 'partcoins'].includes(value)) return 'mixed';
  // "shop", "default", "—": follow ⚙ `commerce.paymentMode`, which is what
  // null means on the item.
  if (['shop', 'default', 'any', 'either'].includes(value)) return null;
  return undefined;
}

type Mapped = { row: Record<string, unknown> | null; problem: { line: number; title: string; reason: string } | null };

const SLUG = /^[a-z0-9][a-z0-9-]{1,48}$/;

/**
 * One sheet row as the API's own item body — or the reason it cannot be.
 *
 * Everything the API would refuse is refused here instead, by line and in
 * words: the operator is looking at their own file and the fix is in it, so
 * "line 14: ₹0 is not a price" beats a 422 with no line number on it. The
 * API validates it all again — it owns the invariants — but by then the
 * sheet has already been read and shown.
 */
function mapRow(row: SheetRow): Mapped {
  const title = pick(row, [...COLUMNS.title]);
  const priceRaw = pick(row, [...COLUMNS.price]);
  const category = pick(row, [...COLUMNS.category]);

  if (!title) {
    // A sheet's trailing rows are often blank-but-present. One with a price
    // and no name is a real mistake; one with neither is not.
    if (!priceRaw && !category) return { row: null, problem: null };
    return { row: null, problem: { line: row.line, title: '', reason: 'No product name in this row.' } };
  }

  const fail = (reason: string): Mapped => ({ row: null, problem: { line: row.line, title, reason } });

  const price = figure(priceRaw);
  if (price === null) {
    return fail(priceRaw ? `“${priceRaw}” is not a price.` : 'No price column found for this row.');
  }
  if (price <= 0) return fail('A price has to be above zero — a free product is a coins-only one.');
  if (price > 1_000_000) return fail(`₹${number(price)} is past the ₹10,00,000 ceiling.`);

  if (!category) return fail('No shelf — every product is filed under one.');

  const id = pick(row, [...COLUMNS.id]).trim().toLowerCase();
  if (id && !SLUG.test(id)) {
    return fail(`“${id}” is not a slug — lowercase letters, numbers and hyphens, like travel-bottle.`);
  }

  const mrp = figure(pick(row, [...COLUMNS.mrp]));
  if (mrp !== null && mrp > 0 && mrp < price) {
    // A strike-through below the price reads as a negative discount on the
    // member's screen, which is worse than no MRP at all.
    return fail(`The MRP (₹${number(mrp)}) is below the price (₹${number(price)}).`);
  }

  const mode = payment(pick(row, [...COLUMNS.paymentMode]));
  const modeRaw = pick(row, [...COLUMNS.paymentMode]);
  if (mode === undefined && modeRaw) {
    return fail(`“${modeRaw}” is not a payment mode — use coins, money, mixed, or leave it blank for the shop's own.`);
  }

  const coinPrice = figure(pick(row, [...COLUMNS.coinPrice]));
  if (coinPrice !== null && coinPrice < 0) return fail('A coin price cannot be negative.');

  const badgeRaw = pick(row, [...COLUMNS.badge]).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (badgeRaw && !BADGES.includes(badgeRaw as (typeof BADGES)[number])) {
    return fail(`“${badgeRaw}” is not a badge — the app draws ${BADGES.join(', ')}.`);
  }

  const onHand = figure(pick(row, [...COLUMNS.onHand]));
  if (onHand !== null && onHand < 0) return fail('Stock cannot be negative.');
  const lowStockAt = figure(pick(row, [...COLUMNS.lowStockAt]));

  const subcategory = pick(row, [...COLUMNS.subcategory]);
  const description = pick(row, [...COLUMNS.description]);
  const imageUrl = pick(row, [...COLUMNS.imageUrl]);
  const images = list(pick(row, [...COLUMNS.images]), 10);
  const tags = list(pick(row, [...COLUMNS.tags]), 20);
  const sizes = list(pick(row, [...COLUMNS.sizes]), 20);
  const swatches = colours(pick(row, [...COLUMNS.colors]));
  const isDeal = truth(pick(row, [...COLUMNS.isDeal]));
  const featured = truth(pick(row, [...COLUMNS.featured]));
  const active = truth(pick(row, [...COLUMNS.active]));
  const sort = figure(pick(row, [...COLUMNS.sort]));

  return {
    problem: null,
    row: {
      line: row.line,
      ...(id ? { id } : {}),
      title: title.slice(0, 120),
      ...(description ? { description: description.slice(0, 2000) } : {}),
      // Rupees in the sheet, paise on the wire.
      price: Math.round(price * 100),
      ...(mrp === null ? {} : { mrp: Math.round(mrp * 100) }),
      ...(coinPrice === null ? {} : { coinPrice: Math.round(coinPrice) }),
      category: category.trim().slice(0, 40),
      ...(subcategory ? { subcategory: subcategory.slice(0, 60) } : {}),
      ...(mode === undefined ? {} : { paymentMode: mode }),
      ...(pick(row, [...COLUMNS.emoji]) ? { emoji: pick(row, [...COLUMNS.emoji]).slice(0, 8) } : {}),
      ...(imageUrl ? { imageUrl: imageUrl.slice(0, 500) } : {}),
      ...(images.length > 0 ? { images: images.map(image => image.slice(0, 500)) } : {}),
      ...(badgeRaw ? { badge: badgeRaw } : {}),
      ...(pick(row, [...COLUMNS.ribbon]) ? { ribbon: pick(row, [...COLUMNS.ribbon]).slice(0, 40) } : {}),
      ...(isDeal === undefined ? {} : { isDeal }),
      ...(featured === undefined ? {} : { featured }),
      ...(tags.length > 0 ? { tags: tags.map(tag => tag.slice(0, 40)) } : {}),
      ...(sizes.length > 0 ? { sizes: sizes.map(size => size.slice(0, 16)) } : {}),
      ...(swatches.length > 0 ? { colors: swatches } : {}),
      ...(sort === null ? {} : { sort: Math.round(sort) }),
      ...(active === undefined ? {} : { active }),
      ...(onHand === null ? {} : { onHand: Math.round(onHand) }),
      ...(lowStockAt === null ? {} : { lowStockAt: Math.max(0, Math.round(lowStockAt)) }),
    },
  };
}

/** The API takes 2,000 rows a call, so a long sheet goes up in slices. */
const BATCH = 250;

export async function importProducts(
  _previous: ImportActionState,
  form: FormData,
): Promise<ImportActionState> {
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a .xlsx or .csv file first.' };
  const dryRun = text(form, 'mode') !== 'import';

  let sheet;
  try {
    sheet = await readSheet(file);
  } catch (error) {
    if (error instanceof SheetError) return { error: error.message };
    throw error;
  }

  const rows: Record<string, unknown>[] = [];
  const failed: { line: number | null; title: string; reason: string }[] = [];
  for (const row of sheet.rows) {
    const mapped = mapRow(row);
    if (mapped.problem) failed.push(mapped.problem);
    else if (mapped.row) rows.push(mapped.row);
  }

  if (rows.length === 0) {
    return {
      error: `Nothing usable in ${file.name}. It needs a header row with at least a name, a price and a shelf — this one has ${
        sheet.headers.length > 0 ? `“${sheet.headers.join('”, “')}”` : 'no headers'
      }.`,
      report: {
        dryRun: true,
        file: file.name,
        sheet: sheet.name,
        headers: sheet.headers,
        rows: sheet.rows.length,
        created: 0,
        updated: 0,
        duplicates: 0,
        failed,
      },
    };
  }

  let created = 0;
  let updated = 0;
  let duplicates = 0;
  for (let at = 0; at < rows.length; at += BATCH) {
    const slice = rows.slice(at, at + BATCH);
    const result = await adminWrite<ItemImportResult>('POST', '/admin/shop/items/import', { rows: slice, dryRun });
    if (!result.ok) {
      return {
        error: `${result.error}${
          at > 0 ? ` — ${number(created + updated)} row(s) before this batch were already written.` : ''
        }`,
      };
    }
    created += result.data.created;
    updated += result.data.updated;
    duplicates += result.data.duplicates;
    failed.push(...result.data.failed);
  }

  if (!dryRun) {
    revalidatePath('/dashboard/catalogue');
    revalidatePath('/dashboard/categories');
  }

  const report = {
    dryRun,
    file: file.name,
    sheet: sheet.name,
    headers: sheet.headers,
    rows: sheet.rows.length,
    created,
    updated,
    duplicates,
    failed,
  };
  const summary = `${number(created)} new, ${number(updated)} corrected${
    duplicates > 0 ? `, ${number(duplicates)} repeated row(s) folded together` : ''
  }${failed.length > 0 ? `, ${number(failed.length)} line(s) skipped` : ''}`;

  return dryRun
    ? { ok: `${file.name} reads as ${summary}. Nothing is written yet — press Import to write it.`, report }
    : { ok: `Imported ${file.name}: ${summary}.`, report };
}
