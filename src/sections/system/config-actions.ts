'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { number } from '@/src/lib/format';
import type { AppConfigView } from '@/src/lib/types';

export type ConfigActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

/**
 * What the operator typed, as the value the key holds.
 *
 * The form is one text box per key, because the config is numbers, flags,
 * strings and the occasional list. The *kind* comes from the key's current
 * value rather than from the typing: a key holding a number takes a number,
 * and an empty box on a key that may be null means null. Anything the API
 * then disagrees with comes back as a sentence naming the key.
 */
function parse(raw: string, kind: string): unknown {
  if (kind === 'boolean') return raw === 'true' || raw === 'on' || raw === '1';
  if (kind === 'number') return Number(raw);
  if (kind === 'json') {
    // A list or an object: typed as JSON, because there is no honest
    // single-line form for `support.topics`.
    return JSON.parse(raw);
  }
  if (raw === '') return null;
  return raw;
}

/**
 * Writes one config key, or puts it back.
 *
 * The API does the checking that matters — an unknown path is refused
 * rather than written, a value of the wrong kind is refused against the
 * shape of the defaults, and the merged config goes through the same
 * cross-field validator every read runs before anything is stored. So this
 * parses, posts, and shows whatever the API says.
 */
export async function setConfigKey(_previous: ConfigActionState, form: FormData): Promise<ConfigActionState> {
  const path = text(form, 'path');
  if (!path) return { error: 'Which key?' };

  const raw = String(form.get('value') ?? '');
  const kind = text(form, 'kind') || 'string';
  let value: unknown;
  try {
    value = parse(raw, kind);
  } catch {
    return { error: `That is not valid JSON. A list looks like ["a","b"], an object like {"key":"value"}.` };
  }
  if (kind === 'number' && !Number.isFinite(value as number)) {
    return { error: `${path} holds a number, and “${raw}” is not one.` };
  }

  const result = await adminWrite<AppConfigView>('PUT', '/admin/config', {
    set: { [path]: value },
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/config');
  const section = path.split('.')[0];
  const changed = result.data.sections.find(entry => entry.section === section);
  return {
    ok: `${path} is now ${JSON.stringify(value)}. ${number(changed?.overrides.length ?? 0)} key(s) in ${section} differ from the code’s defaults.`,
  };
}

/** Puts one key back to the value the code ships — `$unset`, not a guess. */
export async function resetConfigKey(_previous: ConfigActionState, form: FormData): Promise<ConfigActionState> {
  const path = text(form, 'path');
  if (!path) return { error: 'Which key?' };

  const result = await adminWrite<AppConfigView>('PUT', '/admin/config', {
    reset: [path],
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/config');
  return { ok: `${path} is back to the code’s default.` };
}
