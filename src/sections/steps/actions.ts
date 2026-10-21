'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import type { StepsConfigView } from '@/src/lib/types';

export type ConfigState = { ok?: string; error?: string };

/**
 * Writes some of the step knobs.
 *
 * The form sends the patch it built as JSON, because only the form knows
 * which fields the operator actually touched and what kind each one is —
 * and a patch of *only* what changed is what makes two operators editing
 * two sections at once safe.
 *
 * No validation is repeated here: the API's schema is the closed list and
 * its cross-field validator is the authority, and it answers in whole
 * sentences ("coins.sourceCaps.steps (400) exceeds coins.dailyCap (300)")
 * which are handed straight back to the operator.
 */
export async function saveStepsConfig(_previous: ConfigState, form: FormData): Promise<ConfigState> {
  const raw = String(form.get('patch') ?? '{}');
  const resetRaw = String(form.get('reset') ?? '[]');
  const label = String(form.get('label') ?? 'Those settings');

  let patch: unknown;
  let reset: unknown;
  try {
    patch = JSON.parse(raw);
    reset = JSON.parse(resetRaw);
  } catch {
    return { error: 'That form could not be read. Reload the page and try again.' };
  }

  const changed = patch && typeof patch === 'object' ? Object.keys(patch as object).length > 0 : false;
  const resetting = Array.isArray(reset) && reset.length > 0;
  if (!changed && !resetting) return { error: 'Nothing has changed.' };

  const result = await adminWrite<StepsConfigView>('PUT', '/admin/config/steps', {
    ...(changed ? { patch } : {}),
    ...(resetting ? { reset } : {}),
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/steps');
  return {
    ok: resetting && !changed
      ? `Put back to the code’s default. ${result.data.overrides.length} key(s) still overridden.`
      : `${label} saved — in force on the next read, within 30 seconds on every server.`,
  };
}
