'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { number } from '@/src/lib/format';
import type { FaqResult, GuideResult } from '@/src/lib/types';

export type HelpActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();
const toggle = (form: FormData, key: string): boolean => form.getAll(key).map(String).pop() === 'on';

const list = (form: FormData, key: string): string[] =>
  text(form, key)
    .split(/[\n,]/)
    .map(entry => entry.trim())
    .filter(Boolean);

/**
 * Writes a help article, creating it where the id is new.
 *
 * The whole reason the FAQs are a collection rather than a constant: a wave
 * of the same question is answered by writing one row, and the members read
 * it without waiting for an app release.
 */
export async function saveFaq(_previous: HelpActionState, form: FormData): Promise<HelpActionState> {
  const id = text(form, 'id').toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(id)) {
    return { error: 'The id is lowercase letters, numbers and hyphens — like how-coins-expire.' };
  }
  const question = text(form, 'question');
  const answer = text(form, 'answer');
  if (question.length < 5) return { error: 'What is the question, in the words a member would use?' };
  if (answer.length < 5) return { error: 'And the answer.' };

  const result = await adminWrite<FaqResult>('POST', '/admin/support/faqs', {
    id,
    category: text(form, 'category'),
    question,
    answer,
    tags: list(form, 'tags'),
    sort: Number(text(form, 'sort') || 0),
    active: toggle(form, 'active'),
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/faq');
  const { article, created } = result.data;
  return {
    ok: `${created ? 'Written' : 'Saved'}: “${article.question}” under ${article.category}${
      article.active ? ' — members can read it now' : ', hidden for now'
    }.`,
  };
}

/** The one field somebody came to change — usually whether it is showing. */
export async function patchFaq(_previous: HelpActionState, form: FormData): Promise<HelpActionState> {
  const id = text(form, 'id');
  const body: Record<string, unknown> = { note: text(form, 'note') || undefined };
  if (form.get('active') !== null) body.active = toggle(form, 'active');
  if (form.get('sort') !== null && text(form, 'sort')) body.sort = Number(text(form, 'sort'));
  if (form.get('category') !== null && text(form, 'category')) body.category = text(form, 'category');

  const result = await adminWrite<FaqResult>('PUT', `/admin/support/faqs/${encodeURIComponent(id)}`, body);
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/faq');
  return {
    ok: `${result.data.article.id} is ${result.data.article.active ? 'showing' : 'hidden'} · ${result.data.article.category}.`,
  };
}

/**
 * Deletes an article.
 *
 * A real delete, unlike a shop item's retire: nothing holds a snapshot of
 * an FAQ. Hiding it is the other option, and the right one for an answer
 * that is wrong today and will be right next week.
 */
export async function deleteFaq(_previous: HelpActionState, form: FormData): Promise<HelpActionState> {
  const id = text(form, 'id');
  if (text(form, 'confirm') !== id) return { error: `Type ${id} to confirm — or hide it instead.` };

  const result = await adminWrite<{ deleted: true; id: string }>(
    'DELETE',
    `/admin/support/faqs/${encodeURIComponent(id)}`,
    { note: text(form, 'note') || undefined },
  );
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/faq');
  return { ok: `${id} is gone.` };
}

/**
 * Writes a chapter of the app guide.
 *
 * The steps are one per line, `title | body`. The icon and the tint are
 * closed lists because the app parses the whole guide against its contract:
 * a name it cannot draw does not make a blank tile, it makes the guide
 * fail to load on the member's phone.
 */
export async function saveGuideSection(_previous: HelpActionState, form: FormData): Promise<HelpActionState> {
  const id = text(form, 'id').toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(id)) {
    return { error: 'The id is lowercase letters, numbers and hyphens — like first-steps.' };
  }
  const steps: { title: string; body: string }[] = [];
  for (const [index, line] of text(form, 'steps').split('\n').map(entry => entry.trim()).filter(Boolean).entries()) {
    const [title, ...rest] = line.split('|');
    const body = rest.join('|').trim();
    if (!title?.trim() || !body) {
      return { error: `Step ${index + 1}: write it as a title | what to do — two parts, neither empty.` };
    }
    steps.push({ title: title.trim(), body });
  }
  if (steps.length === 0) return { error: 'A chapter with no steps is a heading. Add at least one.' };

  const result = await adminWrite<GuideResult>('POST', '/admin/support/guide', {
    id,
    title: text(form, 'title'),
    summary: text(form, 'summary') || undefined,
    icon: text(form, 'icon') || undefined,
    tint: text(form, 'tint') || undefined,
    steps,
    sort: Number(text(form, 'sort') || 0),
    active: toggle(form, 'active'),
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/faq');
  return {
    ok: `${result.data.created ? 'Written' : 'Saved'}: ${number(steps.length)} step(s) · the guide now has ${number(result.data.totals.active)} chapter(s) showing.`,
  };
}

export async function deleteGuideSection(_previous: HelpActionState, form: FormData): Promise<HelpActionState> {
  const id = text(form, 'id');
  if (text(form, 'confirm') !== id) return { error: `Type ${id} to confirm.` };

  const result = await adminWrite<{ deleted: true; id: string }>(
    'DELETE',
    `/admin/support/guide/${encodeURIComponent(id)}`,
    { note: text(form, 'note') || undefined },
  );
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/faq');
  return { ok: `${id} is gone from the guide.` };
}
