'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { number } from '@/src/lib/format';
import type { AdminPlan, AdminPlanDay, AppConfigView } from '@/src/lib/types';

export type PlanActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();
const flag = (form: FormData, key: string): boolean => form.getAll(key).map(String).pop() === 'on';
const list = (form: FormData, key: string): string[] => form.getAll(key).map(String).filter(Boolean);

function changed(planId?: string): void {
  revalidatePath('/dashboard/diet-plans');
  revalidatePath('/dashboard/nutrition');
  if (planId) revalidatePath(`/dashboard/diet-plans/${encodeURIComponent(planId)}`);
}

const SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'];

/**
 * A plan's programme, as one piece of text.
 *
 * A plan is up to 31 days of up to 8 meals of up to 20 items — several
 * hundred fields. A repeating field editor for that is a week of client
 * state and a form nobody can see the whole of; this is the same shape the
 * rest of the panel uses for a list of small records, scaled to two levels:
 *
 *     # Day one
 *     breakfast | 08:00 | 300 | 15 | 40 | 8 | Idli = 3; Sambar = 1 bowl
 *     lunch     | 13:00 | 500 | 20 | 70 | 12
 *
 * A `#` line starts a day and names it; every other line is a meal in the
 * day above it. It is also what a plan pastes in and out as, which is how
 * a nutritionist's spreadsheet becomes a plan.
 */
function parseDays(raw: string): AdminPlanDay[] | { error: string } {
  const days: AdminPlanDay[] = [];
  const lines = raw.split('\n');

  for (const [index, line] of lines.entries()) {
    const at = index + 1;
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    if (trimmed.startsWith('#')) {
      days.push({ label: trimmed.replace(/^#+\s*/, '').slice(0, 80), meals: [] });
      continue;
    }

    // A programme that opens with a meal is a one-day plan nobody bothered
    // to head, which is a perfectly ordinary thing to write.
    if (days.length === 0) days.push({ label: '', meals: [] });

    const parts = trimmed.split('|').map(part => part.trim());
    if (parts.length < 3) {
      return { error: `Line ${at}: a meal is slot | HH:mm | calories, then protein, carbs, fats and its items.` };
    }
    const [slot, time, calories, protein, carbs, fats, items] = parts;
    if (!SLOTS.includes(slot.toLowerCase())) {
      return { error: `Line ${at}: “${slot}” is not a meal slot — use ${SLOTS.join(', ')}.` };
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return { error: `Line ${at}: “${time}” is not a time — write it as 08:00, 24-hour.` };
    }
    const figure = (value: string | undefined, what: string): number | { error: string } => {
      if (value === undefined || value === '') return 0;
      const parsed = Number(value.replace(/[^\d.-]/g, ''));
      if (!Number.isFinite(parsed) || parsed < 0) return { error: `Line ${at}: “${value}” is not a number of ${what}.` };
      return parsed;
    };
    const kcal = figure(calories, 'calories');
    if (typeof kcal !== 'number') return kcal;
    const p = figure(protein, 'protein');
    if (typeof p !== 'number') return p;
    const c = figure(carbs, 'carbs');
    if (typeof c !== 'number') return c;
    const f = figure(fats, 'fats');
    if (typeof f !== 'number') return f;

    days[days.length - 1].meals.push({
      slot: slot.toLowerCase(),
      time,
      calories: kcal,
      proteinG: p,
      carbsG: c,
      fatsG: f,
      items: (items ?? '')
        .split(';')
        .map(item => item.trim())
        .filter(Boolean)
        .slice(0, 20)
        .map(item => {
          const [name, quantity] = item.split('=').map(part => part.trim());
          return { name: name.slice(0, 120), quantity: (quantity ?? '').slice(0, 80) };
        }),
    });
  }

  if (days.length === 0) return { error: 'A plan needs at least one day, and a day at least one meal.' };
  const empty = days.findIndex(day => day.meals.length === 0);
  if (empty !== -1) return { error: `Day ${empty + 1}${days[empty].label ? ` (${days[empty].label})` : ''} has no meals in it.` };
  return days;
}

/** The way back out — `plan-text.ts`, which the form imports to fill the box. */

/** Writes a plan, new or changed. The days replace the whole programme. */
export async function savePlan(_previous: PlanActionState, form: FormData): Promise<PlanActionState> {
  const id = text(form, 'id');
  const name = text(form, 'name');
  if (!name) return { error: 'What is the plan called?' };

  const dietTypes = list(form, 'dietTypes');
  if (dietTypes.length === 0) return { error: 'Which diets does it suit? Pick at least one.' };
  const mealPlans = list(form, 'mealPlans');
  if (mealPlans.length === 0) return { error: 'Which meal plans does it suit? Pick at least one.' };

  const days = parseDays(String(form.get('days') ?? ''));
  if (!Array.isArray(days)) return { error: days.error };

  const body: Record<string, unknown> = {
    name,
    description: text(form, 'description'),
    emoji: text(form, 'emoji') || undefined,
    dietTypes,
    mealPlans,
    days,
    sort: Number(text(form, 'sort') || 0),
    active: flag(form, 'active'),
  };

  const result = id
    ? await adminWrite<AdminPlan>('PUT', `/admin/diet-plans/${encodeURIComponent(id)}`, body)
    : await adminWrite<AdminPlan>('POST', '/admin/diet-plans', body);
  if (!result.ok) return { error: result.error };

  changed(result.data.id);
  const plan = result.data;
  const meals = plan.days.reduce((sum, day) => sum + day.meals.length, 0);
  return {
    ok: `${id ? 'Saved' : 'Added'} ${plan.name}: ${number(plan.days.length)} day(s), ${number(meals)} meal(s)${
      plan.active ? '' : ' — retired, so nobody is on it'
    }.`,
  };
}

/** Out of the library: everyone on it falls back to the server's own choice. */
export async function retirePlan(_previous: PlanActionState, form: FormData): Promise<PlanActionState> {
  const id = text(form, 'id');
  const active = text(form, 'active') === 'true';

  const result = active
    ? await adminWrite<AdminPlan>('PUT', `/admin/diet-plans/${encodeURIComponent(id)}`, { active: true })
    : await adminWrite<{ plan: AdminPlan; released: number }>('DELETE', `/admin/diet-plans/${encodeURIComponent(id)}`, {});
  if (!result.ok) return { error: result.error };

  changed(id);
  if (active) return { ok: `${(result.data as AdminPlan).name} is back in the library.` };
  const { plan, released } = result.data as { plan: AdminPlan; released: number };
  return {
    ok: `${plan.name} is out of the library${
      released > 0 ? `, and ${number(released)} member(s) are back on the server’s choice` : ''
    }.`,
  };
}

/**
 * Deletes a plan outright — the draft nobody followed.
 *
 * Retiring is the usual answer: the row stays and a member's history still
 * resolves it. Typing the name is the confirmation; anybody on the plan is
 * handed back to the server's choice as it goes.
 */
export async function deletePlan(_previous: PlanActionState, form: FormData): Promise<PlanActionState> {
  const id = text(form, 'id');
  const name = text(form, 'name');
  if (text(form, 'confirm').toLowerCase() !== name.toLowerCase()) {
    return { error: `Type ${name} to confirm — this cannot be undone.` };
  }

  const result = await adminWrite<{ deleted: true; id: string; released: number }>(
    'DELETE',
    `/admin/diet-plans/${encodeURIComponent(id)}/permanent`,
    {},
  );
  if (!result.ok) return { error: result.error };

  changed();
  const { released } = result.data;
  return {
    ok: `${name} is gone${released > 0 ? `, and ${number(released)} member(s) are back on the server’s choice` : ''}.`,
  };
}

// ─── The targets a member starts with (RULES N4) ───────────────────────────

/**
 * Writes ⚙ `nutrition.*` — the goals and preferences a member who has set
 * none of their own is given.
 *
 * Every key goes in one `PUT /admin/config`, because they are one thought:
 * a calorie target with macros that do not add up to it is the mistake this
 * form exists to make hard, and the API validates the whole merged config
 * before storing any of it.
 */
export async function setNutritionDefaults(_previous: PlanActionState, form: FormData): Promise<PlanActionState> {
  const set: Record<string, unknown> = {};
  const figures: [string, string][] = [
    ['nutrition.defaultGoals.calories', 'calories'],
    ['nutrition.defaultGoals.proteinG', 'proteinG'],
    ['nutrition.defaultGoals.carbsG', 'carbsG'],
    ['nutrition.defaultGoals.fatsG', 'fatsG'],
    ['nutrition.maxEntriesPerSave', 'maxEntriesPerSave'],
    ['nutrition.maxAgeDays', 'maxAgeDays'],
    ['nutrition.searchLimit', 'searchLimit'],
    ['nutrition.libraryPageSize', 'libraryPageSize'],
  ];
  for (const [path, field] of figures) {
    const raw = text(form, field);
    if (raw === '') continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) return { error: `${field} holds a number, and “${raw}” is not one.` };
    set[path] = Math.round(value);
  }
  for (const [path, field] of [
    ['nutrition.defaultPreferences.dietType', 'dietType'],
    ['nutrition.defaultPreferences.mealPlan', 'mealPlan'],
    ['nutrition.defaultPreferences.goal', 'goal'],
  ] as [string, string][]) {
    const raw = text(form, field);
    if (raw) set[path] = raw;
  }

  if (Object.keys(set).length === 0) return { error: 'Nothing to change.' };

  const result = await adminWrite<AppConfigView>('PUT', '/admin/config', {
    set,
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/nutrition');
  revalidatePath('/dashboard/config');
  return {
    ok: `Saved ${number(Object.keys(set).length)} setting(s). They apply to every member who has not set their own.`,
  };
}
