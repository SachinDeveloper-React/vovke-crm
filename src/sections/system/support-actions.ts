'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import type { TicketDeleteResult, TicketDetail } from '@/src/lib/types';

export type SupportActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();
const toggle = (form: FormData, key: string): boolean => form.getAll(key).map(String).pop() === 'on';

function refresh(id: string): void {
  revalidatePath('/dashboard/support');
  revalidatePath(`/dashboard/support/${encodeURIComponent(id)}`);
}

/**
 * Answers a member, as support.
 *
 * Telling them is part of the reply rather than a second step — a thread
 * they are never told about is one they will not come back to — and it goes
 * through the same `notify()` every job uses, so their own consent decides
 * whether a push follows the feed row. The status moves in the same write,
 * because "reply and resolve" is one action.
 */
export async function replyToTicket(_previous: SupportActionState, form: FormData): Promise<SupportActionState> {
  const id = text(form, 'id');
  const message = text(form, 'message');
  if (message.length < 2) return { error: 'Write a reply.' };

  const status = text(form, 'status');
  const result = await adminWrite<TicketDetail>('POST', `/admin/support/tickets/${encodeURIComponent(id)}/replies`, {
    message,
    ...(status ? { status } : {}),
    notifyMember: toggle(form, 'notifyMember'),
  });
  if (!result.ok) return { error: result.error };

  refresh(id);
  const told = result.data.notified;
  const where =
    told === null || told === undefined
      ? 'They were not notified.'
      : told.push === 'sent'
        ? 'Pushed to their phone.'
        : told.push === 'deferred'
          ? 'In their notification centre; the push is held by their quiet hours.'
          : told.push === 'category_off'
            ? 'In their notification centre. No push: they have that category switched off.'
            : `In their notification centre (push: ${told.push.replace(/_/g, ' ')}).`;
  return { ok: `Sent. The ticket is ${result.data.ticket.status.replace(/_/g, ' ')}. ${where}` };
}

/** Moves a ticket's state without saying anything in the thread. */
export async function setTicketStatus(_previous: SupportActionState, form: FormData): Promise<SupportActionState> {
  const id = text(form, 'id');
  const status = text(form, 'status');
  if (!status) return { error: 'Which state?' };

  const result = await adminWrite<TicketDetail>('PUT', `/admin/support/tickets/${encodeURIComponent(id)}/status`, {
    status,
    note: text(form, 'note') || undefined,
    notifyMember: toggle(form, 'notifyMember'),
  });
  if (!result.ok) return { error: result.error };

  refresh(id);
  return {
    ok: `${result.data.ticket.reference} is ${status.replace(/_/g, ' ')}${
      status === 'closed' ? ' — they cannot reply to it now, only open a new one' : ''
    }.`,
  };
}

/**
 * Deletes a ticket that should never have been one.
 *
 * The API refuses one support has already replied to, because that would
 * take away the member's copy of what we told them — closing is how a
 * conversation ends. The refusal is the message shown.
 */
export async function deleteTicket(_previous: SupportActionState, form: FormData): Promise<SupportActionState> {
  const id = text(form, 'id');
  const reference = text(form, 'reference');
  if (text(form, 'confirm') !== reference) return { error: `Type ${reference} to confirm.` };
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — spam, or a duplicate of which one.' };

  const result = await adminWrite<TicketDeleteResult>('DELETE', `/admin/support/tickets/${encodeURIComponent(id)}`, {
    reason,
    confirm: true,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath('/dashboard/support');
  return { ok: `${result.data.reference} is gone.` };
}
