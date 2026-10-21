'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { number } from '@/src/lib/format';
import { slugify } from '@/src/lib/slug';
import type {
  CategoryDeleteResult,
  CategoryResult,
  RecategoriseResult,
  SubcategoryDeleteResult,
  SubcategoryEditResult,
  SubcategoryResult,
} from '@/src/lib/types';

export type CategoryActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

/** Both pages read the shelves, and the catalogue's dropdowns are built from them. */
function shelvesChanged(): void {
  revalidatePath('/dashboard/categories');
  revalidatePath('/dashboard/catalogue');
}

// ─── The shelves themselves ────────────────────────────────────────────────

/**
 * Adds a shelf.
 *
 * The slug is the part that is forever — every item carries it — so the form
 * shows what it will be and this sends it explicitly rather than letting
 * the two ends derive it separately and hope they agree.
 */
export async function createCategory(_previous: CategoryActionState, form: FormData): Promise<CategoryActionState> {
  const name = text(form, 'name');
  if (!name) return { error: 'What is the shelf called? That is what a member reads.' };
  const slug = text(form, 'slug') || slugify(name);
  if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(slug)) {
    return { error: `“${name}” does not make a slug — type one, like yoga-pilates.` };
  }

  const result = await adminWrite<CategoryResult>('POST', '/admin/shop/categories', {
    slug,
    name,
    description: text(form, 'description') || undefined,
    icon: text(form, 'icon') || undefined,
    ...(text(form, 'sort') ? { sort: Number(text(form, 'sort')) } : {}),
    active: form.getAll('active').map(String).pop() === 'on',
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  shelvesChanged();
  return { ok: `${name} is a shelf, and items are filed under “${result.data.slug ?? slug}”.` };
}

/** Renames a shelf, moves it along the row, or takes it off the app. Never re-keys it. */
export async function updateCategory(_previous: CategoryActionState, form: FormData): Promise<CategoryActionState> {
  const slug = text(form, 'slug');
  const name = text(form, 'name');
  if (!slug) return { error: 'Which shelf?' };
  if (!name) return { error: 'A shelf needs a name.' };

  const result = await adminWrite<CategoryResult>('PUT', `/admin/shop/categories/${encodeURIComponent(slug)}`, {
    name,
    description: text(form, 'description'),
    icon: text(form, 'icon') || undefined,
    ...(text(form, 'sort') ? { sort: Number(text(form, 'sort')) } : {}),
    active: form.getAll('active').map(String).pop() === 'on',
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  shelvesChanged();
  const shelf = result.data.data.find(entry => entry.category === slug);
  return {
    ok: `Saved: ${name}${shelf && !shelf.shelfActive ? ' — off the app, and its items are where they were' : ''}.`,
  };
}

/**
 * Deletes a shelf, saying where its items go.
 *
 * The API refuses one with items on it and no `moveTo`, because an item
 * whose shelf has gone is an item no filter finds. Typing the slug is the
 * confirmation, as it is everywhere else a delete cannot be undone.
 */
export async function deleteCategory(_previous: CategoryActionState, form: FormData): Promise<CategoryActionState> {
  const slug = text(form, 'slug');
  if (text(form, 'confirm') !== slug) return { error: `Type ${slug} to confirm — this cannot be undone.` };
  const moveTo = text(form, 'moveTo');

  const result = await adminWrite<CategoryDeleteResult>('DELETE', `/admin/shop/categories/${encodeURIComponent(slug)}`, {
    moveTo: moveTo || null,
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  shelvesChanged();
  const { moved, movedTo } = result.data;
  return {
    ok: `${slug} is gone${moved > 0 ? `, and ${number(moved)} item(s) moved to ${movedTo} — unfiled, since their subcategory was this shelf’s` : ''}.`,
  };
}

// ─── The subcategories under them ──────────────────────────────────────────

/** Adds a name to a shelf's list: the second dropdown on the item form. */
export async function createSubcategory(_previous: CategoryActionState, form: FormData): Promise<CategoryActionState> {
  const category = text(form, 'category');
  const name = text(form, 'name');
  if (!category) return { error: 'Which shelf does it go under?' };
  if (!name) return { error: 'What is it called?' };

  const result = await adminWrite<CategoryResult>(
    'POST',
    `/admin/shop/categories/${encodeURIComponent(category)}/subcategories`,
    { name, ...(text(form, 'sort') ? { sort: Number(text(form, 'sort')) } : {}), note: text(form, 'note') || undefined },
  );
  if (!result.ok) return { error: result.error };

  shelvesChanged();
  return { ok: `“${name}” is on ${category}, and the item form offers it now.` };
}

/** Renames one across every item that holds it; an existing name merges the two. */
export async function updateSubcategory(_previous: CategoryActionState, form: FormData): Promise<CategoryActionState> {
  const category = text(form, 'category');
  const from = text(form, 'from');
  const name = text(form, 'name');
  if (!from) return { error: 'Which subcategory?' };
  if (!name) return { error: 'A subcategory needs a name.' };

  const result = await adminWrite<SubcategoryEditResult>(
    'PUT',
    `/admin/shop/categories/${encodeURIComponent(category)}/subcategories/${encodeURIComponent(from)}`,
    {
      name,
      ...(text(form, 'sort') ? { sort: Number(text(form, 'sort')) } : {}),
      active: form.getAll('active').map(String).pop() === 'on',
      note: text(form, 'note') || undefined,
    },
  );
  if (!result.ok) return { error: result.error };

  shelvesChanged();
  const { moved, mergedWith } = result.data;
  if (mergedWith) return { ok: `Merged into “${mergedWith}”: ${number(moved)} item(s) moved across.` };
  return { ok: name === from ? 'Saved.' : `Renamed to “${name}” on ${number(moved)} item(s).` };
}

/** Removes one, and says where the items filed under it went. */
export async function deleteSubcategory(_previous: CategoryActionState, form: FormData): Promise<CategoryActionState> {
  const category = text(form, 'category');
  const name = text(form, 'name');
  const reassignTo = text(form, 'reassignTo');

  const result = await adminWrite<SubcategoryDeleteResult>(
    'DELETE',
    `/admin/shop/categories/${encodeURIComponent(category)}/subcategories/${encodeURIComponent(name)}`,
    { reassignTo: reassignTo || null, note: text(form, 'note') || undefined },
  );
  if (!result.ok) return { error: result.error };

  shelvesChanged();
  const { moved, reassignedTo } = result.data;
  return {
    ok: `“${name}” is gone${
      moved > 0 ? `, and ${number(moved)} item(s) are ${reassignedTo ? `under “${reassignedTo}”` : 'unfiled'}` : ''
    }.`,
  };
}

// ─── Bulk writes across the items ──────────────────────────────────────────

/**
 * Renames a subcategory across every item that holds it.
 *
 * Renaming one to a name already in use is how two are merged, which is the
 * fix for "T-Shirts" sitting beside "T-shirts" — two shelves to a member,
 * one typo to everybody else. Leaving the new name empty files them under
 * nothing.
 */
export async function renameSubcategory(
  _previous: CategoryActionState,
  form: FormData,
): Promise<CategoryActionState> {
  const category = text(form, 'category');
  const from = text(form, 'from');
  if (!from) return { error: 'Which subcategory? Pick the name as it is now.' };
  const to = text(form, 'to');

  const result = await adminWrite<SubcategoryResult>('PUT', '/admin/shop/categories/subcategory', {
    category,
    from,
    to: to || null,
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  shelvesChanged();
  const { moved, mergedWith } = result.data;
  if (!to) return { ok: `${number(moved)} item(s) left unfiled under ${category}.` };
  return {
    ok: mergedWith
      ? `Merged: ${number(moved)} item(s) moved from “${from}” into “${to}”, which already had ${number(mergedWith)}.`
      : `Renamed: ${number(moved)} item(s) now under “${to}”.`,
  };
}

/** Moves a handful of items onto another shelf, in one write and one audit row. */
export async function moveItems(_previous: CategoryActionState, form: FormData): Promise<CategoryActionState> {
  const ids = text(form, 'ids')
    .split(/[\s,\n]+/)
    .map(id => id.trim())
    .filter(Boolean);
  if (ids.length === 0) return { error: 'Which items? Paste their slugs, one per line or comma-separated.' };
  if (ids.length > 100) return { error: 'A hundred at a time is the limit — the audit row holds each one’s old shelf.' };

  const subcategory = text(form, 'subcategory');
  const body: Record<string, unknown> = {
    ids,
    category: text(form, 'category'),
    note: text(form, 'note') || undefined,
  };
  // Absent means "leave each item's own subcategory alone"; an empty box with
  // the clear switch on means "unfile them".
  if (form.getAll('clearSubcategory').map(String).pop() === 'on') body.subcategory = null;
  else if (subcategory) body.subcategory = subcategory;

  const result = await adminWrite<RecategoriseResult>('POST', '/admin/shop/categories/move', body);
  if (!result.ok) return { error: result.error };

  shelvesChanged();
  const { moved, missing } = result.data;
  return {
    ok: `${number(moved)} item(s) moved to ${text(form, 'category')}${
      missing.length > 0 ? ` · not found: ${missing.join(', ')}` : ''
    }.`,
  };
}
