'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import { coins as formatCoins } from '@/src/lib/format';
import type { AdjustResult, GrantBadgeResult, MemberStatus, VerifyContactResult } from '@/src/lib/types';

export type MoneyActionState = { ok?: string; error?: string };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

/**
 * A switch's value, from a field the form sends twice.
 *
 * An unchecked switch submits nothing, so each one is preceded by a hidden
 * `off`. Checked, the browser sends `off` and then `on`; unchecked, only
 * `off` — so the *last* value is the answer, and a missing field means the
 * form did not carry that switch at all.
 */
const toggle = (form: FormData, key: string): boolean | undefined => {
  const values = form.getAll(key).map(String);
  if (values.length === 0) return undefined;
  return values[values.length - 1] === 'on';
};

/**
 * A correction to what a member was paid.
 *
 * The ledger is append-only, so this writes a new row rather than editing
 * one: a clawback appears in the member's own wallet as a line they can see,
 * not as coins that quietly vanished.
 */
export async function adjustCoins(_previous: MoneyActionState, form: FormData): Promise<MoneyActionState> {
  const userId = text(form, 'userId');
  const direction = text(form, 'direction');
  const magnitude = Number(text(form, 'amount'));

  if (!Number.isFinite(magnitude) || magnitude <= 0) return { error: 'How many coins? A number above zero.' };
  const title = text(form, 'title');
  const reason = text(form, 'reason');
  if (title.length < 3) return { error: 'The member sees the title — give it at least a few words.' };
  if (reason.length < 3) return { error: 'The reason is kept on the audit row. Say why.' };

  const result = await adminWrite<AdjustResult>('POST', `/admin/users/${encodeURIComponent(userId)}/coins`, {
    amount: direction === 'clawback' ? -magnitude : magnitude,
    title,
    reason,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath(`/dashboard/users/${userId}/coins`);
  const { data } = result;
  return {
    ok:
      data.direction === 'credit'
        ? `${formatCoins(data.amount)} coins credited. Balance is now ${formatCoins(data.balance)}.`
        : `${formatCoins(data.amount)} coins clawed back. Balance is now ${formatCoins(data.balance)}.`,
  };
}

/**
 * Frozen stops the account spending and leaves everything else alone; a
 * legal hold keeps it out of the deletion job's way. Both need a reason,
 * because an account state nobody can explain is worse than the state.
 */
export async function setStatus(_previous: MoneyActionState, form: FormData): Promise<MoneyActionState> {
  const userId = text(form, 'userId');
  const reason = text(form, 'reason');
  if (reason.length < 3) return { error: 'Say why — it is kept on the audit row, for whoever reads it next.' };

  const body: Record<string, unknown> = { reason };
  const frozen = toggle(form, 'frozen');
  const legalHold = toggle(form, 'legalHold');
  if (frozen !== undefined) body.frozen = frozen;
  if (legalHold !== undefined) body.legalHold = legalHold;

  const result = await adminWrite<MemberStatus>('PUT', `/admin/users/${encodeURIComponent(userId)}/status`, body);
  if (!result.ok) return { error: result.error };

  revalidatePath(`/dashboard/users/${userId}`);
  const { data } = result;
  return {
    ok: `Saved. ${data.frozen ? 'Frozen — the account cannot spend.' : 'Not frozen.'} ${
      data.legalHold ? 'Legal hold on: the deletion job will leave it alone.' : 'No legal hold.'
    }`,
  };
}

/**
 * Takes a contact detail as proven, for the member who cannot prove it.
 *
 * The case is the one with no other answer: the SMS never arrives, so
 * `verify-otp` can never succeed and the member sits behind the verified-
 * contacts gate for good. Support has established who they are by then —
 * what is missing is the code, not the identity.
 *
 * It unlocks redeeming, payouts and addresses, so the number or address is
 * typed back before it will go, and there is no route that undoes it.
 */
export async function verifyContact(
  _previous: MoneyActionState,
  form: FormData,
): Promise<MoneyActionState> {
  const userId = text(form, 'userId');
  const channel = text(form, 'channel') === 'email' ? 'email' : 'phone';
  const confirm = text(form, 'confirm');
  const reason = text(form, 'reason');

  if (confirm.length < 3) {
    return { error: `Type the ${channel === 'phone' ? 'number' : 'address'} back to confirm it.` };
  }
  if (reason.length < 3) return { error: 'Say why it is being done by hand — it is kept on the audit row.' };

  const result = await adminWrite<VerifyContactResult>(
    'POST',
    `/admin/users/${encodeURIComponent(userId)}/verify-contact`,
    { channel, confirm, reason },
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(`/dashboard/users/${userId}`);
  const { data } = result;
  return {
    ok: `Their ${channel === 'phone' ? 'number' : 'email address'} is verified, and they have been told.${
      data.canRedeem
        ? ' Both details are proven, so they can redeem and add an address now.'
        : ` The other detail is still unproven, so redeeming stays shut until it is.`
    }`,
  };
}

/**
 * Unlocks a badge by hand, through the same path the rules use: it pays what
 * the badge is worth where badge coins are on, tells the member, and granting
 * one they already hold does nothing.
 */
export async function grantBadge(_previous: MoneyActionState, form: FormData): Promise<MoneyActionState> {
  const userId = text(form, 'userId');
  const achievementId = text(form, 'achievementId');
  const reason = text(form, 'reason');
  if (!achievementId) return { error: 'Pick the badge.' };
  if (reason.length < 3) return { error: 'Say why — a badge given by hand should be explainable.' };

  const result = await adminWrite<GrantBadgeResult>(
    'POST',
    `/admin/users/${encodeURIComponent(userId)}/achievements`,
    { achievementId, reason },
  );
  if (!result.ok) return { error: result.error };

  revalidatePath(`/dashboard/users/${userId}/badges`);
  const { data } = result;
  if (data.already) return { ok: `They already hold ${data.label}; nothing was sent.` };
  return {
    ok: `${data.label} is on their shelf.${
      data.rewardCoins > 0
        ? data.paid
          ? ` ${formatCoins(data.rewardCoins)} coins were paid.`
          : ` Its ${formatCoins(data.rewardCoins)} coins wait on the badge-coins switch.`
        : ''
    } They have been told.`,
  };
}
