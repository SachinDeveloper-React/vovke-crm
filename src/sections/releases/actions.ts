'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import type { ReleaseRow, UpdatePolicyResult } from '@/src/lib/types';

export type ReleaseState = { ok?: string; error?: string };

const VERSION = /^\d+(\.\d+){0,3}$/;

const text = (form: FormData, key: string): string | undefined => {
  const value = String(form.get(key) ?? '').trim();
  return value === '' ? undefined : value;
};

/**
 * Records the build the store is now serving.
 *
 * A knock at most: this never walls anybody off on its own. Naming a new
 * `current` steps the old one down to `supported`; the wall is the minimum
 * version, which is the other form on this page and a separate decision on
 * purpose — a routine release must not be able to lock anybody out by
 * accident.
 */
export async function saveRelease(_previous: ReleaseState, form: FormData): Promise<ReleaseState> {
  const platform = String(form.get('platform') ?? '');
  const version = String(form.get('version') ?? '').trim();
  const build = String(form.get('build') ?? '').trim();
  const status = String(form.get('status') ?? 'current');

  if (platform !== 'ios' && platform !== 'android') return { error: 'Pick a platform.' };
  if (!VERSION.test(version)) return { error: 'A version looks like 1.2.3.' };
  if (!build) return { error: 'The build number is what the store shows beside the version.' };

  const result = await adminWrite<ReleaseRow>('POST', '/admin/releases', {
    platform,
    version,
    build,
    status,
    notes: text(form, 'notes'),
    minOs: text(form, 'minOs'),
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/releases');
  return {
    ok: `${platform} ${result.data.version} (${result.data.build}) recorded as ${result.data.status}. Nobody has been walled off — raise the minimum below to make it mandatory.`,
  };
}

/**
 * The wall itself, and the words on both prompts.
 *
 * Raising `minVersion` is what makes an update mandatory: every build below
 * it is refused. The API refuses a minimum above what the store is actually
 * serving, because that would leave members with nowhere to go — and an app
 * with nowhere to send them is worse than an old build.
 */
export async function setUpdatePolicy(_previous: ReleaseState, form: FormData): Promise<ReleaseState> {
  const ios = text(form, 'minIos');
  const android = text(form, 'minAndroid');
  for (const [label, value] of [['iOS', ios], ['Android', android]] as const) {
    if (value && !VERSION.test(value)) return { error: `The ${label} minimum looks like 1.2.3.` };
  }

  const remind = text(form, 'remindAfterHours');
  const body: Record<string, unknown> = {
    ...(ios || android ? { minVersion: { ...(ios ? { ios } : {}), ...(android ? { android } : {}) } } : {}),
    nudgeOnNewer: form.get('nudgeOnNewer') === 'on',
    ...(remind ? { remindAfterHours: Number(remind) } : {}),
  };
  for (const key of ['hardTitle', 'hardMessage', 'softTitle', 'softMessage', 'actionLabel', 'laterLabel'] as const) {
    const value = text(form, key);
    if (value) body[key] = value;
  }

  const result = await adminWrite<UpdatePolicyResult>('PUT', '/admin/app/update-policy', body);
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/releases');
  const { minVersion } = result.data;
  return {
    ok: `In force now: iOS ${minVersion.ios}, Android ${minVersion.android}. Every build below its platform's line is refused with the wall.`,
  };
}
