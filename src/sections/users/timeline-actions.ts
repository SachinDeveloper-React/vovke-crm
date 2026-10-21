'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { paths } from '@/src/layout/paths';
import type { DayRejections } from '@/src/lib/types';

export type ActionState = { ok?: string; error?: string };

/**
 * Which of a day's phones it is allowed to count (D-88).
 *
 * The scoring settles the ordinary case on its own: each minute goes to the
 * phone that counted the most in it, so a walk two phones both saw counts
 * once (D-53). What it cannot settle is whose leg the phone was on — an
 * install lent to somebody, a watch left running on a treadmill. That is a
 * judgement, and this is the operator making it.
 *
 * The form posts the whole set to reject rather than one id to toggle, which
 * is what makes "keep only this phone" a single call and an empty set the way
 * to give a day back. The API re-scores the day before it answers, so the
 * figures in the message are the day as it now stands rather than a guess at
 * what it will become.
 */
export async function setDayRejections(_previous: ActionState, form: FormData): Promise<ActionState> {
  const userId = String(form.get('userId') ?? '');
  const localDay = String(form.get('localDay') ?? '');
  const note = String(form.get('note') ?? '').trim();
  // One field, repeated: `getAll` is what a set of checkboxes posts, and it
  // is also what a "keep only this one" button sends in one go.
  const reject = form
    .getAll('reject')
    .map(value => String(value))
    .filter(Boolean);

  if (!userId || !/^\d{4}-\d{2}-\d{2}$/.test(localDay)) {
    return { error: 'That day could not be read.' };
  }

  const result = await adminWrite<DayRejections>(
    'PUT',
    `/admin/users/${encodeURIComponent(userId)}/days/${localDay}/devices/rejected`,
    { reject, ...(note ? { note } : {}) },
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(paths.dashboard.users.timeline(userId));
  revalidatePath(paths.dashboard.users.steps(userId));

  const { day, devices } = result.data;
  const out = devices.filter(device => device.rejected);
  const steps = day.steps.toLocaleString('en-IN');
  const verified = day.verifiedSteps.toLocaleString('en-IN');

  return {
    ok:
      out.length === 0
        ? `Every phone counts again. ${localDay} is now ${steps} steps, ${verified} verified.`
        : `${out.map(device => device.name).join(', ')} left out. ${localDay} is now ${steps} steps, ${verified} verified.`,
  };
}
