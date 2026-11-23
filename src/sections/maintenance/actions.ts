'use server';

import { revalidatePath } from 'next/cache';

import { ADMIN_TIMEZONE, adminWrite } from '@/src/lib/api';
import { dateTime, instantFromLocalInput } from '@/src/lib/format';
import type { MaintenanceSettings } from '@/src/lib/types';

export type MaintenanceActionState = { ok?: string; error?: string };

const PAGE = '/dashboard/maintenance';
const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

/**
 * Maintenance on, off, or reworded (RULES DV14). `intent` says which: `on`
 * and `update` send the words and the expected end, `off` sends only the
 * switch — the API clears the expected end with it, since a promised time
 * belongs to one stretch of maintenance and not the next.
 */
export async function saveMaintenance(
  _previous: MaintenanceActionState,
  form: FormData,
): Promise<MaintenanceActionState> {
  const intent = text(form, 'intent');
  if (intent !== 'on' && intent !== 'off' && intent !== 'update') return { error: 'On, off, or new words?' };

  const body: Record<string, unknown> = {};
  if (intent === 'on') body.enabled = true;
  if (intent === 'off') body.enabled = false;

  if (intent !== 'off') {
    const title = text(form, 'title');
    const message = text(form, 'message');
    if (!title) return { error: 'The screen needs a title — it is the first thing a member reads.' };
    if (!message) return { error: 'Say what is happening, in a sentence a member understands.' };
    body.title = title;
    body.message = message;
    const raw = text(form, 'endsAt');
    if (raw) {
      const endsAt = instantFromLocalInput(raw, ADMIN_TIMEZONE);
      if (!endsAt) return { error: 'That expected end is not a date and time.' };
      if (Date.parse(endsAt) <= Date.now()) return { error: 'That time has already passed. Leave it empty if there is no time to promise.' };
      body.endsAt = endsAt;
    } else {
      body.endsAt = null;
    }
  }

  const result = await adminWrite<MaintenanceSettings>('PUT', '/admin/maintenance', body);
  if (!result.ok) return { error: result.error };

  revalidatePath(PAGE);
  const { maintenance } = result.data;
  if (intent === 'off') return { ok: 'Maintenance is off. Phones on the maintenance screen open the app within half a minute.' };
  if (intent === 'on') {
    return {
      ok: `Maintenance is on. Members see “${maintenance.title}”${
        maintenance.endsAt ? `, back by ${dateTime(maintenance.endsAt)}` : ''
      }; testers carry on.`,
    };
  }
  return { ok: 'Saved. Phones on the maintenance screen show the new words on their next check.' };
}

/** A tester, by email, phone or member id. */
export async function addTester(_previous: MaintenanceActionState, form: FormData): Promise<MaintenanceActionState> {
  const identifier = text(form, 'identifier');
  if (identifier.length < 3) return { error: 'An email, a phone number or a member id.' };
  const result = await adminWrite<MaintenanceSettings & { tester: MaintenanceSettings['testers'][number] }>(
    'POST',
    '/admin/maintenance/testers',
    { identifier },
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(PAGE);
  const { tester } = result.data;
  return { ok: `${tester.name || tester.email || tester.phone || tester.id} can use the app during maintenance.` };
}

export async function removeTester(_previous: MaintenanceActionState, form: FormData): Promise<MaintenanceActionState> {
  const id = text(form, 'id');
  if (!id) return { error: 'Which tester?' };
  const result = await adminWrite<MaintenanceSettings>('DELETE', `/admin/maintenance/testers/${encodeURIComponent(id)}`);
  if (!result.ok) return { error: result.error };

  revalidatePath(PAGE);
  return { ok: 'Taken off the list.' };
}
