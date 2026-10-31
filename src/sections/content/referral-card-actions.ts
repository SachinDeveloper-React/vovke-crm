'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import type { ReferralCardResult } from '@/src/lib/types';

/**
 * The invite card the app draws around the place (BACKEND §6.15).
 *
 * Ten screens that earn coins each carry one, and all of it — the heading,
 * the line, the button's words, the colour, the glyph, and which screens it
 * appears on at all — lives in `referral_promos`. So a campaign is an edit
 * here rather than a release.
 *
 * The reward is the one thing not written here. `{coins}` and
 * `{friendCoins}` in the words are filled by the server from
 * `coins.referral` as it is actually paying: a typed-in figure would
 * eventually be one the ledger does not honour, on a card that is a promise.
 */

export type ReferralCardActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();
const toggle = (form: FormData, key: string): boolean => form.getAll(key).map(String).pop() === 'on';

function changed(): void {
  revalidatePath('/dashboard/referral-cards');
}

/** Writes one card, creating it where the id is new. */
export async function saveReferralCard(
  _previous: ReferralCardActionState,
  form: FormData,
): Promise<ReferralCardActionState> {
  const id = text(form, 'id').toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(id)) {
    return { error: 'The id is lowercase letters, numbers and hyphens — like home-invite-1.' };
  }
  const title = text(form, 'title');
  if (title.length < 3) return { error: 'What should the card say at the top?' };
  const message = text(form, 'message');
  if (message.length < 3) return { error: 'What is the pitch under the heading?' };

  const result = await adminWrite<ReferralCardResult>('POST', '/admin/referral-cards', {
    id,
    screen: text(form, 'screen'),
    title,
    message,
    ctaLabel: text(form, 'ctaLabel') || undefined,
    accent: text(form, 'accent') || undefined,
    position: text(form, 'position') || undefined,
    emoji: text(form, 'emoji') || undefined,
    sort: Number(text(form, 'sort') || 0),
    active: toggle(form, 'active'),
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };

  changed();
  const { card, created } = result.data;
  return {
    ok: `${created ? 'Written' : 'Saved'} for ${card.screen}, ${card.position} of the screen: “${
      card.title
    }”${card.active ? '' : ' — hidden for now'}.`,
  };
}

/** The one field somebody came to change — the order, or whether it shows. */
export async function patchReferralCard(
  _previous: ReferralCardActionState,
  form: FormData,
): Promise<ReferralCardActionState> {
  const id = text(form, 'id');
  if (!id) return { error: 'Which card?' };

  const result = await adminWrite<ReferralCardResult>(
    'PUT',
    `/admin/referral-cards/${encodeURIComponent(id)}`,
    { sort: Number(text(form, 'sort') || 0), active: toggle(form, 'active'), note: 'quick edit' },
  );
  if (!result.ok) return { error: result.error };

  changed();
  const { card } = result.data;
  return { ok: card.active ? `Showing, at ${card.sort}.` : 'Hidden — the rotation skips it.' };
}

/**
 * Deletes a card.
 *
 * A real delete: nothing holds a snapshot of one — no order, no ledger row,
 * no ticket points at a card. Hiding it is the other option, and the right
 * one for a campaign being drafted or one that has been pulled.
 */
export async function deleteReferralCard(
  _previous: ReferralCardActionState,
  form: FormData,
): Promise<ReferralCardActionState> {
  const id = text(form, 'id');
  if (text(form, 'confirm') !== id) return { error: `Type ${id} to confirm.` };

  const result = await adminWrite<{ deleted: true; id: string }>(
    'DELETE',
    `/admin/referral-cards/${encodeURIComponent(id)}`,
    { note: text(form, 'note') || undefined },
  );
  if (!result.ok) return { error: result.error };

  changed();
  return { ok: `${id} is gone.` };
}
