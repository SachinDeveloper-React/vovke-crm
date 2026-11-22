'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { adminWrite } from '@/src/lib/api';

import type { StaffDetail, StaffView } from './types';

/**
 * Every change to a staff account (RULES Z9). The API decides who may do
 * what to whom — a manager only to their own agents, role changes and moves
 * only by an admin — and says why when it refuses; these actions only carry
 * the form across and show its answer.
 */

export type StaffFormState = { ok?: string; error?: string; temporaryPassword?: string; email?: string };

const field = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
const permissionsOf = (form: FormData) => form.getAll('permissions').map(String).filter(Boolean);

function refresh(staffId?: string) {
  revalidatePath('/dashboard/staff');
  if (staffId) revalidatePath(`/dashboard/staff/${staffId}`);
}

export async function createStaff(_previous: StaffFormState, form: FormData): Promise<StaffFormState> {
  const role = field(form, 'role');
  const body = {
    name: field(form, 'name'),
    email: field(form, 'email').toLowerCase(),
    role,
    ...(role === 'agent' && field(form, 'managerId') ? { managerId: field(form, 'managerId') } : {}),
    permissions: role === 'admin' ? [] : permissionsOf(form),
  };
  if (!body.name || !body.email) return { error: 'A name and a work email are both needed.' };
  const result = await adminWrite<{ staff: StaffView; temporaryPassword: string }>('POST', '/admin/staff', body);
  if (!result.ok) return { error: result.error };
  refresh();
  return {
    ok: `${result.data.staff.name} can sign in now. Give them this temporary password privately — it is shown only once, and they choose their own at first sign-in.`,
    temporaryPassword: result.data.temporaryPassword,
    email: result.data.staff.email,
  };
}

export async function saveStaff(_previous: StaffFormState, form: FormData): Promise<StaffFormState> {
  const id = field(form, 'staffId');
  const body: Record<string, unknown> = {};
  if (form.has('name')) body.name = field(form, 'name');
  if (form.get('editPermissions') === 'yes') body.permissions = permissionsOf(form);
  const result = await adminWrite<StaffDetail & { agentsTrimmed?: number }>('PUT', `/admin/staff/${encodeURIComponent(id)}`, body);
  if (!result.ok) return { error: result.error };
  refresh(id);
  const trimmed = result.data.agentsTrimmed ?? 0;
  return {
    ok: `Saved. ${result.data.effectivePermissions.length} permissions in force.${trimmed ? ` ${trimmed} of their agents lost what they no longer hold.` : ''}`,
  };
}

export async function suspendStaff(_previous: StaffFormState, form: FormData): Promise<StaffFormState> {
  const id = field(form, 'staffId');
  const result = await adminWrite<{ sessionsEnded: number; agentsBlocked: number }>('POST', `/admin/staff/${encodeURIComponent(id)}/suspend`, {
    reason: field(form, 'reason'),
  });
  if (!result.ok) return { error: result.error };
  refresh(id);
  const { sessionsEnded, agentsBlocked } = result.data;
  return {
    ok: `Suspended. ${sessionsEnded} session${sessionsEnded === 1 ? '' : 's'} ended.${agentsBlocked ? ` Their ${agentsBlocked} agent${agentsBlocked === 1 ? ' is' : 's are'} blocked until moved to another manager or this one is back.` : ''}`,
  };
}

export async function reactivateStaff(_previous: StaffFormState, form: FormData): Promise<StaffFormState> {
  const id = field(form, 'staffId');
  const result = await adminWrite('POST', `/admin/staff/${encodeURIComponent(id)}/reactivate`);
  if (!result.ok) return { error: result.error };
  refresh(id);
  return { ok: 'Active again. They can sign in with their own password.' };
}

export async function resetStaffPassword(_previous: StaffFormState, form: FormData): Promise<StaffFormState> {
  const id = field(form, 'staffId');
  const result = await adminWrite<{ temporaryPassword: string; sessionsEnded: number }>('POST', `/admin/staff/${encodeURIComponent(id)}/reset-password`);
  if (!result.ok) return { error: result.error };
  refresh(id);
  return {
    ok: `Password reset and every session of theirs ended. Give them this temporary password privately — shown once.`,
    temporaryPassword: result.data.temporaryPassword,
  };
}

export async function resetStaffTotp(_previous: StaffFormState, form: FormData): Promise<StaffFormState> {
  const id = field(form, 'staffId');
  const result = await adminWrite('POST', `/admin/staff/${encodeURIComponent(id)}/reset-totp`);
  if (!result.ok) return { error: result.error };
  refresh(id);
  return { ok: 'Authenticator removed and signed out. Their next sign-in asks them to scan a new QR code.' };
}

export async function signOutStaff(_previous: StaffFormState, form: FormData): Promise<StaffFormState> {
  const id = field(form, 'staffId');
  const result = await adminWrite<{ sessionsEnded: number }>('POST', `/admin/staff/${encodeURIComponent(id)}/logout-all`);
  if (!result.ok) return { error: result.error };
  refresh(id);
  return { ok: `${result.data.sessionsEnded} session${result.data.sessionsEnded === 1 ? '' : 's'} ended.` };
}

export async function reassignStaff(_previous: StaffFormState, form: FormData): Promise<StaffFormState> {
  const id = field(form, 'staffId');
  const result = await adminWrite<StaffDetail & { dropped: string[] }>('PUT', `/admin/staff/${encodeURIComponent(id)}/manager`, {
    managerId: field(form, 'managerId'),
  });
  if (!result.ok) return { error: result.error };
  refresh(id);
  const dropped = result.data.dropped ?? [];
  return {
    ok: `Now under ${result.data.manager?.name ?? 'the new manager'}.${dropped.length ? ` Dropped what the new manager does not hold: ${dropped.join(', ')}.` : ''}`,
  };
}

export async function changeStaffRole(_previous: StaffFormState, form: FormData): Promise<StaffFormState> {
  const id = field(form, 'staffId');
  const role = field(form, 'role');
  const result = await adminWrite<StaffDetail & { dropped: string[] }>('PUT', `/admin/staff/${encodeURIComponent(id)}/role`, {
    role,
    ...(role === 'agent' ? { managerId: field(form, 'managerId') } : {}),
  });
  if (!result.ok) return { error: result.error };
  refresh(id);
  const dropped = result.data.dropped ?? [];
  return { ok: `Now ${role === 'admin' ? 'an admin' : `a ${role}`}. They were signed out to pick up the change.${dropped.length ? ` Dropped: ${dropped.join(', ')}.` : ''}` };
}

export async function deleteStaff(_previous: StaffFormState, form: FormData): Promise<StaffFormState> {
  const id = field(form, 'staffId');
  if (field(form, 'confirm').toLowerCase() !== field(form, 'email').toLowerCase()) {
    return { error: 'Type their email exactly to confirm.' };
  }
  const result = await adminWrite('DELETE', `/admin/staff/${encodeURIComponent(id)}`);
  if (!result.ok) return { error: result.error };
  refresh();
  redirect('/dashboard/staff');
}
