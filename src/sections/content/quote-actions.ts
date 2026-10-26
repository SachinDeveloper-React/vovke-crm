'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { number } from '@/src/lib/format';
import type { TipResult, TipsAddResult } from '@/src/lib/types';

/**
 * The lines the app says in its own voice (BACKEND §6.15).
 *
 * Every screen with something encouraging on it draws it from
 * `content_tips`, one per topic per day in rotation — the home card's
 * quote, the tip beside the water log, the reminder plan's note, the two
 * vital screens' advice. That was always the design and the words were
 * always *seeded*, so changing a quote a member reads every seventh day
 * meant a deploy. This is the half that was missing.
 */

export type QuoteActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();
const toggle = (form: FormData, key: string): boolean => form.getAll(key).map(String).pop() === 'on';

function changed(): void {
  revalidatePath('/dashboard/quotes');
}

/** Writes one line, creating it where the id is new. */
export async function saveTip(_previous: QuoteActionState, form: FormData): Promise<QuoteActionState> {
  const id = text(form, 'id').toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(id)) {
    return { error: 'The id is lowercase letters, numbers and hyphens — like motivation-6.' };
  }
  const body = text(form, 'text');
  if (body.length < 3) return { error: 'What should the screen say?' };

  const result = await adminWrite<TipResult>('POST', '/admin/tips', {
    id,
    topic: text(form, 'topic'),
    // Empty means no heading, which is what the quote cards want: a heading
    // on one of those is drawn over the line it is meant to be.
    title: text(form, 'title') || null,
    text: body,
    sort: Number(text(form, 'sort') || 0),
    active: toggle(form, 'active'),
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  changed();
  const { tip, created } = result.data;
  return {
    ok: `${created ? 'Written' : 'Saved'} for ${tip.topic}: “${
      tip.text.length > 80 ? `${tip.text.slice(0, 77)}…` : tip.text
    }”${tip.active ? '' : ' — hidden for now'}.`,
  };
}

/** The one field somebody came to change — the order, or whether it shows. */
export async function patchTip(_previous: QuoteActionState, form: FormData): Promise<QuoteActionState> {
  const id = text(form, 'id');
  if (!id) return { error: 'Which line?' };

  const result = await adminWrite<TipResult>('PUT', `/admin/tips/${encodeURIComponent(id)}`, {
    sort: Number(text(form, 'sort') || 0),
    active: toggle(form, 'active'),
    note: 'quick edit',
  });
  if (!result.ok) return { error: result.error };

  changed();
  const { tip } = result.data;
  return { ok: tip.active ? `Showing, at ${tip.sort}.` : 'Hidden — the rotation skips it.' };
}

/**
 * Deletes a line.
 *
 * A real delete, unlike a shop item's: nothing holds a snapshot of a tip —
 * no order, no ticket, no log points at one. Hiding it is the other option,
 * and the right one for a line being drafted or withdrawn for a fortnight.
 */
export async function deleteTip(_previous: QuoteActionState, form: FormData): Promise<QuoteActionState> {
  const id = text(form, 'id');
  if (text(form, 'confirm') !== id) return { error: `Type ${id} to confirm.` };

  const result = await adminWrite<{ deleted: true; id: string }>(
    'DELETE',
    `/admin/tips/${encodeURIComponent(id)}`,
    { note: text(form, 'note') || undefined },
  );
  if (!result.ok) return { error: result.error };

  changed();
  return { ok: `${id} is gone.` };
}

/**
 * A list of lines for one screen in one go.
 *
 * Writing quotes is not a one-at-a-time job: somebody arrives with twenty
 * of them in a document. One per line, each added at the end of that
 * screen's rotation with the next free id, and a line the screen already
 * holds word for word is skipped rather than written twice — a list pasted
 * twice is the same list.
 */
export async function addTips(_previous: QuoteActionState, form: FormData): Promise<QuoteActionState> {
  const topic = text(form, 'topic');
  const lines = text(form, 'lines')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return { error: 'Paste the lines first — one per line.' };
  if (lines.length > 200) return { error: `${number(lines.length)} lines at once is too many; 200 is the limit.` };
  const tooLong = lines.find(line => line.length > 600);
  if (tooLong) return { error: `One line is ${tooLong.length} characters; 600 is the limit.` };

  const result = await adminWrite<TipsAddResult>('POST', '/admin/tips/bulk', {
    topic,
    lines: lines.map(line => ({ text: line })),
    active: toggle(form, 'active'),
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  changed();
  const { added, skipped } = result.data;
  return {
    ok: `${number(added)} line(s) added to ${topic}${
      skipped > 0 ? `, ${number(skipped)} already there word for word` : ''
    }.`,
  };
}
