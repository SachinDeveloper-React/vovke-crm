'use server';

import { revalidatePath } from 'next/cache';

import { ADMIN_TIMEZONE, adminWrite } from '@/src/lib/api';
import { dateTime, instantFromLocalInput } from '@/src/lib/format';
import type { AppIconSettings } from '@/src/lib/types';

export type IconActionState = { ok?: string; error?: string };

const PAGE = '/dashboard/app-icon';
const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

const labelOf = (settings: AppIconSettings, key: string | null): string =>
  key === null ? 'none' : (settings.catalog.find(icon => icon.key === key)?.label ?? key);

/**
 * The everyday icon, or the festive one switched on by hand (`icon` empty
 * takes it off). Either way the phones pick it up the next time each is
 * opened — there is nothing to push.
 */
export async function chooseAppIcon(_previous: IconActionState, form: FormData): Promise<IconActionState> {
  const slot = text(form, 'slot');
  const icon = text(form, 'icon');
  if (slot !== 'base' && slot !== 'festive') return { error: 'Choose the everyday icon or a festive one.' };
  if (slot === 'base' && !icon) return { error: 'The everyday icon cannot be none.' };

  const result = await adminWrite<AppIconSettings>(
    'PUT',
    '/admin/app-icon',
    slot === 'base' ? { base: icon } : { festive: icon || null },
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(PAGE);
  const settings = result.data;
  if (slot === 'base') return { ok: `${labelOf(settings, settings.base)} is the everyday icon now.` };
  return settings.festive
    ? { ok: `${labelOf(settings, settings.festive)} is on, ahead of the schedule, until you turn it off.` }
    : { ok: `Festive icon off. Phones are on ${labelOf(settings, settings.live.icon)}.` };
}

/** A festive icon on the schedule, between two moments in the panel's own zone. */
export async function addIconWindow(_previous: IconActionState, form: FormData): Promise<IconActionState> {
  const icon = text(form, 'icon');
  const startsAt = text(form, 'startsAt') ? instantFromLocalInput(text(form, 'startsAt'), ADMIN_TIMEZONE) : null;
  const endsAt = text(form, 'endsAt') ? instantFromLocalInput(text(form, 'endsAt'), ADMIN_TIMEZONE) : null;
  if (!icon) return { error: 'Pick the festive icon.' };
  if (!startsAt || !endsAt) return { error: 'It needs a start and an end.' };
  if (Date.parse(endsAt) <= Date.parse(startsAt)) return { error: 'The end has to come after the start.' };

  const note = text(form, 'note');
  const result = await adminWrite<AppIconSettings>('POST', '/admin/app-icon/schedule', {
    icon,
    startsAt,
    endsAt,
    ...(note ? { note } : {}),
  });
  if (!result.ok) return { error: result.error };

  revalidatePath(PAGE);
  return { ok: `${labelOf(result.data, icon)} scheduled, ${dateTime(startsAt)} to ${dateTime(endsAt)}.` };
}

export async function removeIconWindow(_previous: IconActionState, form: FormData): Promise<IconActionState> {
  const id = text(form, 'id');
  if (!id) return { error: 'Which window?' };
  const result = await adminWrite<AppIconSettings>('DELETE', `/admin/app-icon/schedule/${encodeURIComponent(id)}`);
  if (!result.ok) return { error: result.error };

  revalidatePath(PAGE);
  return { ok: 'Taken off the schedule.' };
}
