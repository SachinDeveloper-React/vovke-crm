'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { number } from '@/src/lib/format';
import type { TrainingResult } from '@/src/lib/types';

export type TrainingActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();
const flag = (form: FormData, key: string): boolean => form.getAll(key).map(String).pop() === 'on';
const list = (form: FormData, key: string): string[] => form.getAll(key).map(String).filter(Boolean);

function changed(): void {
  revalidatePath('/dashboard/workouts');
}

/** Writes an exercise, new or changed. The id is fixed once a template names it. */
export async function saveExercise(_previous: TrainingActionState, form: FormData): Promise<TrainingActionState> {
  const id = text(form, 'id');
  const name = text(form, 'name');
  if (!name) return { error: 'What is the exercise called?' };

  const body: Record<string, unknown> = {
    name,
    muscleGroup: text(form, 'muscleGroup'),
    equipment: text(form, 'equipment'),
    isTimed: flag(form, 'isTimed'),
    imageUrl: text(form, 'imageUrl') || null,
    note: text(form, 'note') || undefined,
  };

  const result = id
    ? await adminWrite<TrainingResult>('PUT', `/admin/training/exercises/${encodeURIComponent(id)}`, body)
    : await adminWrite<TrainingResult>('POST', '/admin/training/exercises', {
        ...body,
        ...(text(form, 'slug') ? { id: text(form, 'slug') } : {}),
      });
  if (!result.ok) return { error: result.error };

  changed();
  return {
    ok: `${id ? 'Saved' : 'Added'} ${name} · ${text(form, 'muscleGroup')} · ${text(form, 'equipment')}${
      flag(form, 'isTimed') ? ' · timed' : ''
    }.`,
  };
}

/**
 * Deletes an exercise.
 *
 * The API refuses one a template names: the app carries whole exercises in
 * a template, so the phone would drop the template rather than show a gap.
 * Workouts already logged are not in the way — each keeps its own copy of
 * what was done.
 */
export async function deleteExercise(_previous: TrainingActionState, form: FormData): Promise<TrainingActionState> {
  const id = text(form, 'id');
  if (text(form, 'confirm') !== id) return { error: `Type ${id} to confirm — this cannot be undone.` };

  const result = await adminWrite<TrainingResult>('DELETE', `/admin/training/exercises/${encodeURIComponent(id)}`, {
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  changed();
  return { ok: `${id} is gone. ${number(result.data.totals.exercises)} exercise(s) left.` };
}

/** Writes a template. The exercises are sent in the order they were picked. */
export async function saveTemplate(_previous: TrainingActionState, form: FormData): Promise<TrainingActionState> {
  const id = text(form, 'id');
  const title = text(form, 'title');
  if (!title) return { error: 'What is the workout called?' };

  const exerciseIds = list(form, 'exerciseIds');
  if (exerciseIds.length === 0) return { error: 'Pick the exercises — a template is the order they are done in.' };

  const minutes = Number(text(form, 'estimatedMinutes'));
  if (!Number.isFinite(minutes) || minutes < 1) return { error: 'How long does it take? Minutes, above zero.' };

  const groups = list(form, 'muscleGroups');
  const body: Record<string, unknown> = {
    title,
    description: text(form, 'description'),
    estimatedMinutes: Math.round(minutes),
    exerciseIds,
    // Empty means "whatever the exercises work", which the API fills in.
    ...(groups.length > 0 ? { muscleGroups: groups } : {}),
    sort: Number(text(form, 'sort') || 0),
    note: text(form, 'note') || undefined,
  };

  const result = id
    ? await adminWrite<TrainingResult>('PUT', `/admin/training/templates/${encodeURIComponent(id)}`, body)
    : await adminWrite<TrainingResult>('POST', '/admin/training/templates', {
        ...body,
        ...(text(form, 'slug') ? { id: text(form, 'slug') } : {}),
      });
  if (!result.ok) return { error: result.error };

  changed();
  return {
    ok: `${id ? 'Saved' : 'Added'} ${title}: ${number(exerciseIds.length)} exercise(s), about ${number(
      Math.round(minutes),
    )} minutes.`,
  };
}

/** Deletes a template. A workout started from one keeps its own copy, so nothing dangles. */
export async function deleteTemplate(_previous: TrainingActionState, form: FormData): Promise<TrainingActionState> {
  const id = text(form, 'id');
  if (text(form, 'confirm') !== id) return { error: `Type ${id} to confirm — this cannot be undone.` };

  const result = await adminWrite<TrainingResult>('DELETE', `/admin/training/templates/${encodeURIComponent(id)}`, {
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  changed();
  return { ok: `${id} is gone. ${number(result.data.totals.templates)} template(s) left.` };
}
