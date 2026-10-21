'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { number } from '@/src/lib/format';
import { pick, readSheet, SheetError, type SheetRow } from '@/src/lib/spreadsheet';
import type { AdminFood, FoodImportResult } from '@/src/lib/types';

export type FoodActionState = {
  ok?: string;
  error?: string;
  /** What the sheet said, when the last press was a check or an import. */
  report?: {
    dryRun: boolean;
    file: string;
    sheet: string;
    headers: string[];
    rows: number;
    created: number;
    updated: number;
    duplicates: number;
    failed: { line: number | null; name: string; reason: string }[];
  };
};

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();
const flag = (form: FormData, key: string): boolean => form.getAll(key).map(String).pop() === 'on';

function changed(): void {
  revalidatePath('/dashboard/foods');
  revalidatePath('/dashboard/nutrition');
}

const nutrients = (form: FormData) => ({
  proteinG: Number(text(form, 'proteinG') || 0),
  carbsG: Number(text(form, 'carbsG') || 0),
  fatsG: Number(text(form, 'fatsG') || 0),
  fiberG: Number(text(form, 'fiberG') || 0),
});

/** Writes a food, new or changed. */
export async function saveFood(_previous: FoodActionState, form: FormData): Promise<FoodActionState> {
  const id = text(form, 'id');
  const name = text(form, 'name');
  if (!name) return { error: 'What is it called? A food is its name — that is what a search matches.' };

  const calories = Number(text(form, 'calories'));
  if (!Number.isFinite(calories) || calories < 0) return { error: 'Calories, as a number.' };

  const body: Record<string, unknown> = {
    name,
    portion: text(form, 'portion') || '1 serving',
    emoji: text(form, 'emoji') || undefined,
    calories,
    ...nutrients(form),
    quickAdd: flag(form, 'quickAdd'),
    sort: Number(text(form, 'sort') || 0),
    active: flag(form, 'active'),
  };

  const result = id
    ? await adminWrite<AdminFood>('PUT', `/admin/foods/${encodeURIComponent(id)}`, body)
    : await adminWrite<AdminFood>('POST', '/admin/foods', body);
  if (!result.ok) return { error: result.error };

  changed();
  const food = result.data;
  return {
    ok: `${id ? 'Saved' : 'Added'} ${food.name} · ${food.portion} · ${number(food.calories)} kcal${
      food.quickAdd ? ' · a quick-add tile' : ''
    }${food.active ? '' : ' · retired'}.`,
  };
}

/** Out of search, the quick-add row and the library — or back into them. */
export async function retireFood(_previous: FoodActionState, form: FormData): Promise<FoodActionState> {
  const id = text(form, 'id');
  const active = text(form, 'active') === 'true';

  const result = active
    ? await adminWrite<AdminFood>('PUT', `/admin/foods/${encodeURIComponent(id)}`, { active: true })
    : await adminWrite<AdminFood>('DELETE', `/admin/foods/${encodeURIComponent(id)}`, {});
  if (!result.ok) return { error: result.error };

  changed();
  return { ok: active ? `${result.data.name} is back in the library.` : `${result.data.name} is out of the library.` };
}

/**
 * Deletes a food outright.
 *
 * Safe, and the API says why: a logged meal keeps its own copy of every
 * figure, so nothing a member ate changes. Retiring is still the right
 * answer for a food that was real — this is for the row imported from the
 * wrong column.
 */
export async function deleteFood(_previous: FoodActionState, form: FormData): Promise<FoodActionState> {
  const id = text(form, 'id');
  const name = text(form, 'name');
  if (text(form, 'confirm').toLowerCase() !== name.toLowerCase()) {
    return { error: `Type ${name} to confirm — this cannot be undone.` };
  }

  const result = await adminWrite<{ deleted: true; id: string }>(
    'DELETE',
    `/admin/foods/${encodeURIComponent(id)}/permanent`,
    {},
  );
  if (!result.ok) return { error: result.error };

  changed();
  return { ok: `${name} is gone. What members already logged is untouched.` };
}

// ─── The spreadsheet (RULES N8) ────────────────────────────────────────────

/**
 * The column names a sheet in the wild actually uses.
 *
 * Matched case- and space-insensitively, first one found wins. The point is
 * that an operator exports what they have and presses the button, rather
 * than renaming headers to match a format nobody wrote down.
 */
const COLUMNS = {
  name: ['name', 'food', 'item', 'food name', 'title', 'description'],
  portion: ['portion', 'serving', 'serving size', 'quantity', 'qty', 'size', 'unit', 'measure'],
  calories: ['calories', 'kcal', 'cal', 'energy', 'energy kcal', 'calories kcal'],
  proteinG: ['protein', 'protein g', 'proteins', 'protein grams'],
  carbsG: ['carbs', 'carb', 'carbohydrate', 'carbohydrates', 'carbs g', 'total carbohydrate'],
  fatsG: ['fat', 'fats', 'fat g', 'total fat'],
  fiberG: ['fiber', 'fibre', 'fiber g', 'dietary fiber'],
  emoji: ['emoji', 'icon'],
  quickAdd: ['quickadd', 'quick add', 'quick', 'shortcut', 'tile'],
  sort: ['sort', 'order', 'position', 'rank'],
  active: ['active', 'enabled', 'live', 'published'],
} as const;

/**
 * A cell as a number.
 *
 * Sheets carry units and separators in the cell — "104 kcal", "3.2 g",
 * "1,040" — and refusing those would send somebody back to clean a file
 * that is perfectly readable.
 */
function figure(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, '').replace(/[^\d.-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** "yes", "TRUE", "1", "y" — the four things a spreadsheet means by a tick. */
function truth(raw: string): boolean | undefined {
  const value = raw.trim().toLowerCase();
  if (value === '') return undefined;
  return ['yes', 'y', 'true', '1', 'on', 'x', '✓'].includes(value);
}

type Mapped = { row: Record<string, unknown> | null; problem: { line: number; name: string; reason: string } | null };

function mapRow(row: SheetRow): Mapped {
  const name = pick(row, [...COLUMNS.name]);
  const caloriesRaw = pick(row, [...COLUMNS.calories]);
  const calories = figure(caloriesRaw);

  if (!name) {
    // A sheet's trailing rows are often blank-but-present; one with a
    // calorie count and no name is a real mistake, one with neither is not.
    if (!caloriesRaw) return { row: null, problem: null };
    return { row: null, problem: { line: row.line, name: '', reason: 'No name in this row.' } };
  }
  if (calories === null) {
    return {
      row: null,
      problem: { line: row.line, name, reason: caloriesRaw ? `“${caloriesRaw}” is not a number of calories.` : 'No calories column found for this row.' },
    };
  }

  const quickAdd = truth(pick(row, [...COLUMNS.quickAdd]));
  const active = truth(pick(row, [...COLUMNS.active]));
  const sort = figure(pick(row, [...COLUMNS.sort]));

  return {
    problem: null,
    row: {
      line: row.line,
      name: name.slice(0, 120),
      portion: (pick(row, [...COLUMNS.portion]) || '1 serving').slice(0, 80),
      emoji: pick(row, [...COLUMNS.emoji]).slice(0, 8) || undefined,
      calories: Math.max(0, Math.round(calories)),
      proteinG: Math.max(0, figure(pick(row, [...COLUMNS.proteinG])) ?? 0),
      carbsG: Math.max(0, figure(pick(row, [...COLUMNS.carbsG])) ?? 0),
      fatsG: Math.max(0, figure(pick(row, [...COLUMNS.fatsG])) ?? 0),
      fiberG: Math.max(0, figure(pick(row, [...COLUMNS.fiberG])) ?? 0),
      ...(quickAdd === undefined ? {} : { quickAdd }),
      ...(active === undefined ? {} : { active }),
      ...(sort === null ? {} : { sort: Math.round(sort) }),
    },
  };
}

/** The API takes 2,000 rows a call, so a long sheet goes up in slices. */
const BATCH = 500;

/**
 * Reads the uploaded sheet and sends its rows to the API.
 *
 * Two presses, one action: **Check the sheet** maps the file and asks the
 * API what it *would* do, writing nothing; **Import** does it. The check is
 * not a nicety — a spreadsheet's columns are whatever somebody typed, and
 * seeing "402 rows, 3 new, 399 corrections, 2 lines I cannot read" before
 * pressing the button is the difference between an import and an accident.
 *
 * Rows are matched by name, so importing the same sheet twice corrects the
 * same foods rather than adding a second copy of each.
 */
export async function importFoods(_previous: FoodActionState, form: FormData): Promise<FoodActionState> {
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
  const failed: { line: number | null; name: string; reason: string }[] = [];
  for (const row of sheet.rows) {
    const mapped = mapRow(row);
    if (mapped.problem) failed.push(mapped.problem);
    else if (mapped.row) rows.push(mapped.row);
  }

  if (rows.length === 0) {
    return {
      error: `Nothing usable in ${file.name}. It needs a header row with at least a name and a calories column — this one has ${
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
    const result = await adminWrite<FoodImportResult>('POST', '/admin/foods/import', { rows: slice, dryRun });
    if (!result.ok) {
      return {
        error: `${result.error}${at > 0 ? ` — ${number(created + updated)} row(s) before this batch were already written.` : ''}`,
      };
    }
    created += result.data.created;
    updated += result.data.updated;
    duplicates += result.data.duplicates;
    failed.push(...result.data.failed);
  }

  if (!dryRun) changed();

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
