'use server';

import { revalidatePath } from 'next/cache';

import { adminGet, adminWrite } from '@/src/lib/api';
import type { AppConfigView } from '@/src/lib/types';

import { at, CONTACT_GROUPS, labelled, planSave } from './fields';

export type ContactActionState = { ok?: string; error?: string };

const PAGE = '/dashboard/contact';

type Saved = AppConfigView & { website: 'done' | 'off' | 'failed' | null };

/** The live and the shipped value of every key, from the same read the page made. */
async function configValues() {
  const config = await adminGet<AppConfigView>('/admin/config');
  const effective = Object.fromEntries(config.sections.map(section => [section.section, section.effective]));
  const defaults = Object.fromEntries(config.sections.map(section => [section.section, section.defaults]));
  return {
    current: (path: string) => at(effective, path),
    shipped: (path: string) => at(defaults, path),
  };
}

const WEBSITE: Record<NonNullable<Saved['website']>, string> = {
  done: 'The website shows it now.',
  off: 'The website picks it up within the hour.',
  failed: 'The website could not be told straight away, so it picks it up within the hour.',
};

/**
 * Saves one group of boxes (RULES P21).
 *
 * Only what moved is sent — and a box typed back to the code's own value is
 * sent as a reset, so the key follows the code again instead of holding a
 * copy of it. The API checks the form of each (an email mail can reach, a
 * number in international form, an https link) and its refusal comes back
 * with the box's label in it.
 */
async function saveGroup(form: FormData): Promise<ContactActionState> {
  const group = CONTACT_GROUPS.find(entry => entry.id === String(form.get('group') ?? ''));
  if (!group) return { error: 'Which group of details?' };

  const { current, shipped } = await configValues();
  const plan = planSave(group, path => (form.has(path) ? String(form.get(path)) : null), current, shipped);
  if (plan.changed.length === 0) return { ok: 'Nothing changed.' };

  const result = await adminWrite<Saved>('PUT', '/admin/config', {
    ...(Object.keys(plan.set).length > 0 ? { set: plan.set } : {}),
    ...(plan.reset.length > 0 ? { reset: plan.reset } : {}),
    note: `Contact & links: ${group.title}`,
  });
  if (!result.ok) return { error: labelled(result.error) };

  revalidatePath(PAGE);
  revalidatePath('/dashboard/config');
  const names = plan.changed.map(field => field.label).join(', ');
  const site = result.data.website ? ` ${WEBSITE[result.data.website]}` : '';
  return { ok: `Saved: ${names}. The app shows it the next time the screen opens.${site}` };
}

/** Puts one box back to what the code ships — `$unset`, so it follows the code from now on. */
async function resetField(path: string): Promise<ContactActionState> {
  const field = CONTACT_GROUPS.flatMap(group => group.fields).find(entry => entry.path === path);
  if (!field) return { error: 'Which detail?' };

  const result = await adminWrite<Saved>('PUT', '/admin/config', {
    reset: [path],
    note: `Contact & links: ${field.label} back to the default`,
  });
  if (!result.ok) return { error: labelled(result.error) };

  revalidatePath(PAGE);
  revalidatePath('/dashboard/config');
  const site = result.data.website ? ` ${WEBSITE[result.data.website]}` : '';
  return { ok: `${field.label} is back to the default.${site}` };
}

/**
 * The page's one action: a group saved, or — with `reset` naming a key —
 * one box put back. One action rather than two so a group's form has one
 * answer to show, whichever button was pressed last.
 */
export async function contactAction(_previous: ContactActionState, form: FormData): Promise<ContactActionState> {
  const reset = form.get('reset');
  return typeof reset === 'string' && reset ? resetField(reset) : saveGroup(form);
}
