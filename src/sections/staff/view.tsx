import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { DataTable, FilterBar, Kv, OffsetPager, Panel, RowLink, SearchFilter, SelectFilter, Stat } from '@/src/components/ui';
import { DialogButton } from '@/src/components/ui/dialog-button';
import { adminGet, currentStaff, type StaffMe } from '@/src/lib/api';
import { ago, dateTime, number } from '@/src/lib/format';

import { PasswordForm } from '../auth/setup-forms';
import { EndSessionButton } from './session-forms';
import {
  CreateStaffForm, DeleteStaffForm, EditStaffForm, ReassignForm, ResetPasswordForm, ResetTotpForm, RoleForm, SignOutEverywhereForm,
  SuspendForm,
} from './forms';
import type { ActivityList, ActivityRow, PermissionCatalogue, StaffDetail, StaffList, StaffSession, StaffView } from './types';

/**
 * The people who run VOKVE (RULES Z9). Every figure and every button here is
 * the API's answer for *this* person: a manager's list is their own team,
 * and an action the API would refuse is not offered.
 */

export function RoleChip({ role }: { role: string }) {
  const color = role === 'admin' || role === 'root' ? 'error' : role === 'manager' ? 'warning' : 'info';
  return (
    <Label color={color} variant="soft">
      {role === 'root' ? 'owner key' : role}
    </Label>
  );
}

export function StatusChip({ staff }: { staff: Pick<StaffView, 'status' | 'blockedByManager' | 'lockedUntil' | 'mustChangePassword' | 'totpEnabled'> }) {
  if (staff.status === 'suspended') return <Label color="error" variant="soft">suspended</Label>;
  if (staff.status === 'deleted') return <Label color="default" variant="soft">deleted</Label>;
  if (staff.blockedByManager) return <Label color="error" variant="soft">blocked · manager off</Label>;
  if (staff.lockedUntil) return <Label color="warning" variant="soft">locked out</Label>;
  if (staff.mustChangePassword || !staff.totpEnabled) return <Label color="warning" variant="soft">not set up yet</Label>;
  return <Label color="success" variant="soft">active</Label>;
}

const isTop = (me: StaffMe) => me.kind === 'root' || me.role === 'admin';

async function activeManagers(me: StaffMe): Promise<StaffView[]> {
  if (!isTop(me)) return [];
  const list = await adminGet<StaffList>('/admin/staff', { role: 'manager', status: 'active', limit: 200 });
  return list.data;
}

// ─── The team ────────────────────────────────────────────────────────────────

export type StaffQuery = { q: string; role: string; status: string; limit: number; offset: number };

export async function StaffListView({ query }: { query: StaffQuery }) {
  const me = await currentStaff();
  if (!me) return null;
  const [list, catalogue, managers] = await Promise.all([
    adminGet<StaffList>('/admin/staff', {
      q: query.q || undefined,
      role: query.role || undefined,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    }),
    adminGet<PermissionCatalogue>('/admin/staff/permissions'),
    activeManagers(me),
  ]);
  const canManage = isTop(me) || me.effectivePermissions.includes('staff.manage');
  const s = list.summary ?? {};
  const count = (role: string) => (s[`${role}.active`] ?? 0) + (s[`${role}.suspended`] ?? 0);

  return (
    <Stack spacing={3}>
      {list.summary && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stat label="Admins" value={number(count('admin'))} icon="solar:crown-bold-duotone" goodDirection="none" hint={`${number(s['admin.suspended'] ?? 0)} suspended`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stat label="Managers" value={number(count('manager'))} icon="solar:user-check-bold-duotone" goodDirection="none" hint={`${number(s['manager.suspended'] ?? 0)} suspended`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stat label="Agents" value={number(count('agent'))} icon="solar:user-bold-duotone" goodDirection="none" hint={`${number(s['agent.suspended'] ?? 0)} suspended`} />
          </Grid>
        </Grid>
      )}

      <FilterBar>
        <SearchFilter value={query.q} placeholder="Name or email" />
        {isTop(me) && (
          <SelectFilter
            label="Role"
            param="role"
            value={query.role}
            options={[
              { value: '', label: 'Every role' },
              { value: 'admin', label: 'Admins' },
              { value: 'manager', label: 'Managers' },
              { value: 'agent', label: 'Agents' },
            ]}
            width={150}
          />
        )}
        <SelectFilter
          label="Status"
          param="status"
          value={query.status}
          options={[
            { value: 'any', label: 'Active and suspended' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
          ]}
          width={200}
        />
      </FilterBar>

      <Panel
        title={isTop(me) ? 'Everybody who runs VOKVE' : 'You and your agents'}
        subtitle={`${number(list.total)} ${list.total === 1 ? 'person' : 'people'}`}
        note="Permissions are checked by the API on every request. An agent never holds more than their manager does right now; switching a manager off switches their agents off."
        action={
          canManage ? (
            <DialogButton label="Add a person" icon="solar:user-plus-bold-duotone" variant="contained" title="A new staff account" subtitle="They get a temporary password and set their own, with an authenticator, at first sign-in." maxWidth="md">
              <CreateStaffForm catalogue={catalogue} myRole={me.role} myId={me.id} myPermissions={me.effectivePermissions} managers={managers} />
            </DialogButton>
          ) : null
        }
        dense
      >
        <DataTable
          columns={[
            { label: 'Person' },
            { label: 'Role' },
            { label: 'Manager' },
            { label: 'Status' },
            { label: 'Permissions', align: 'right' },
            { label: 'Last active', align: 'right' },
          ]}
          rows={list.data.map(row => ({
            key: row.id,
            tone: row.status !== 'active' || row.blockedByManager ? 'danger' : 'default',
            cells: [
              <RowLink key="who" href={`/dashboard/staff/${encodeURIComponent(row.id)}`} secondary={row.email}>
                {row.name}
                {row.id === me.id ? ' (you)' : ''}
              </RowLink>,
              <Stack key="role" direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <RoleChip role={row.role} />
                {row.role === 'manager' && row.agents != null && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {row.agents} agent{row.agents === 1 ? '' : 's'}
                  </Typography>
                )}
              </Stack>,
              row.manager ? row.manager.name : '—',
              <StatusChip key="status" staff={row} />,
              row.role === 'admin' ? 'all' : `${row.effectivePermissions.length}${row.dormantPermissions.length ? ` (+${row.dormantPermissions.length} dormant)` : ''}`,
              <Typography key="seen" variant="body2" sx={{ textAlign: 'right' }}>
                {row.lastActiveAt ? ago(row.lastActiveAt) : row.lastLoginAt ? ago(row.lastLoginAt) : 'never'}
              </Typography>,
            ],
          }))}
          empty={isTop(me) ? 'Nobody yet. Add the first manager, then let them add their agents.' : 'No agents yet. Add your first one.'}
        />
        <OffsetPager total={list.total} offset={list.offset} limit={list.limit} />
      </Panel>
    </Stack>
  );
}

// ─── One person ──────────────────────────────────────────────────────────────

function permissionLabels(catalogue: PermissionCatalogue) {
  return new Map(catalogue.groups.flatMap(group => group.permissions.map(p => [p.key, `${group.label}: ${p.label}`] as const)));
}

export async function StaffDetailView({ staffId }: { staffId: string }) {
  const me = await currentStaff();
  if (!me) return null;
  const [staff, catalogue, managers, sessions, activity] = await Promise.all([
    adminGet<StaffDetail>(`/admin/staff/${encodeURIComponent(staffId)}`),
    adminGet<PermissionCatalogue>('/admin/staff/permissions'),
    activeManagers(me),
    adminGet<{ data: StaffSession[] }>(`/admin/staff/${encodeURIComponent(staffId)}/sessions`),
    me.effectivePermissions.includes('audit.view') || isTop(me)
      ? adminGet<ActivityList>('/admin/staff/activity', { staffId, limit: 25 })
      : Promise.resolve(null),
  ]);
  const labels = permissionLabels(catalogue);
  // What may be ticked for this person: an agent, only what their manager holds.
  const managerOfStaff = staff.role === 'agent' ? managers.find(m => m.id === staff.manager?.id) : null;
  const allowed =
    staff.role === 'agent'
      ? isTop(me)
        ? (managerOfStaff?.effectivePermissions ?? staff.effectivePermissions)
        : me.effectivePermissions
      : null;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="Account">
            <Kv
              items={[
                { label: 'Role', value: <RoleChip role={staff.role} /> },
                { label: 'Status', value: <StatusChip staff={staff} /> },
                { label: 'Email', value: staff.email },
                ...(staff.role === 'agent'
                  ? [{ label: 'Manager', value: staff.manager ? `${staff.manager.name} (${staff.manager.status})` : 'none' }]
                  : []),
                { label: 'Authenticator', value: staff.totpEnabled ? 'on' : 'not set up yet' },
                { label: 'Last sign-in', value: staff.lastLoginAt ? `${ago(staff.lastLoginAt)} · ${dateTime(staff.lastLoginAt)}` : 'never' },
                { label: 'Last active', value: staff.lastActiveAt ? ago(staff.lastActiveAt) : '—' },
                { label: 'Created', value: staff.createdAt ? `${dateTime(staff.createdAt)}${staff.createdBy ? ` by ${staff.createdBy.name}` : ''}` : '—' },
                ...(staff.status === 'suspended'
                  ? [{ label: 'Suspended', value: `${staff.suspendedAt ? dateTime(staff.suspendedAt) : ''} by ${staff.suspendedBy?.name ?? '?'} — “${staff.suspendReason ?? ''}”` }]
                  : []),
              ]}
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel
            title="What they can do now"
            subtitle={staff.role === 'admin' ? 'Everything — the role is the grant' : `${staff.effectivePermissions.length} permissions in force`}
            note={staff.dormantPermissions.length ? `Dormant (granted, but their manager no longer holds them): ${staff.dormantPermissions.map(p => labels.get(p) ?? p).join('; ')}` : undefined}
          >
            {staff.role === 'admin' ? (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Every page and every action, including managing other admins.
              </Typography>
            ) : staff.effectivePermissions.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Nothing yet — they can sign in and see only My account.
              </Typography>
            ) : (
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                {staff.effectivePermissions.map(p => (
                  <Label key={p} variant="soft" color="default">
                    {labels.get(p) ?? p}
                  </Label>
                ))}
              </Stack>
            )}
          </Panel>
        </Grid>
      </Grid>

      {staff.can.manage && (
        <Panel title="Name and permissions" subtitle={staff.role === 'agent' ? 'Only what their manager holds can be ticked' : undefined}>
          <EditStaffForm staff={staff} catalogue={catalogue} allowed={allowed} />
        </Panel>
      )}

      {staff.can.manage && (
        <Panel title="Access" subtitle="Each of these signs them out of every browser at once">
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <SuspendForm staff={staff} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <ResetPasswordForm staffId={staff.id} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <ResetTotpForm staffId={staff.id} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <SignOutEverywhereForm staffId={staff.id} />
            </Grid>
          </Grid>
        </Panel>
      )}

      {(staff.can.reassign || staff.can.changeRole || staff.can.manage) && (
        <Grid container spacing={3}>
          {staff.can.reassign && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Panel title="Move to another manager">
                <ReassignForm staff={staff} managers={managers} />
              </Panel>
            </Grid>
          )}
          {staff.can.changeRole && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Panel title="Promote or demote">
                <RoleForm staff={staff} managers={managers} />
              </Panel>
            </Grid>
          )}
          {staff.can.manage && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Panel title="Delete">
                <DeleteStaffForm staff={staff} />
              </Panel>
            </Grid>
          )}
        </Grid>
      )}

      {staff.role === 'manager' && (
        <Panel title="Their team" subtitle={`${staff.team.length} agent${staff.team.length === 1 ? '' : 's'}`} dense>
          <DataTable
            columns={[{ label: 'Agent' }, { label: 'Status' }, { label: 'Permissions', align: 'right' }, { label: 'Last active', align: 'right' }]}
            rows={staff.team.map(agent => ({
              key: agent.id,
              cells: [
                <RowLink key="a" href={`/dashboard/staff/${encodeURIComponent(agent.id)}`} secondary={agent.email}>
                  {agent.name}
                </RowLink>,
                <StatusChip key="s" staff={agent} />,
                String(agent.effectivePermissions.length),
                agent.lastActiveAt ? ago(agent.lastActiveAt) : 'never',
              ],
            }))}
            empty="No agents yet."
          />
        </Panel>
      )}

      <Panel title="Signed in on" subtitle={`${sessions.data.length} open session${sessions.data.length === 1 ? '' : 's'}`} dense>
        <SessionsTable sessions={sessions.data} />
      </Panel>

      {activity && (
        <Panel title="Recent activity" subtitle="By them, and done to their account" dense>
          <ActivityTable rows={activity.data} />
        </Panel>
      )}
    </Stack>
  );
}

function SessionsTable({ sessions, own = false }: { sessions: StaffSession[]; own?: boolean }) {
  return (
    <DataTable
      columns={[{ label: 'Browser' }, { label: 'From' }, { label: 'Opened' }, { label: 'Last seen', align: 'right' }, ...(own ? [{ label: '', align: 'right' as const, width: 120 }] : [])]}
      rows={sessions.map(session => ({
        key: session.id,
        cells: [
          <Typography key="ua" variant="caption" sx={{ display: 'block', maxWidth: 360, color: 'text.secondary' }}>
            {session.current ? '★ this browser · ' : ''}
            {session.userAgent ?? 'unknown'}
            {session.mfa ? ' · with authenticator' : ''}
          </Typography>,
          session.ip ?? '—',
          session.createdAt ? dateTime(session.createdAt) : '—',
          session.lastSeenAt ? ago(session.lastSeenAt) : '—',
          ...(own ? [session.current ? '' : <EndSessionButton key="end" sessionId={session.id} />] : []),
        ],
      }))}
      empty="Not signed in anywhere."
    />
  );
}

// ─── The activity log ────────────────────────────────────────────────────────

function describe(row: ActivityRow): string {
  if (row.kind === 'auth') {
    const events: Record<string, string> = {
      login: 'signed in',
      login_failed: 'failed to sign in',
      login_locked: 'tried to sign in while locked',
      locked: 'was locked out (too many wrong attempts)',
      logout: 'signed out',
      password_changed: 'changed their password',
      totp_enrolled: 'set up their authenticator',
    };
    return events[row.event ?? ''] ?? row.event ?? 'auth';
  }
  return `${row.method} ${row.route ?? row.path}`;
}

export function ActivityTable({ rows }: { rows: ActivityRow[] }) {
  return (
    <DataTable
      columns={[{ label: 'When' }, { label: 'Who' }, { label: 'What' }, { label: 'Permission' }, { label: 'Result', align: 'right' }]}
      rows={rows.map(row => ({
        key: row.id,
        tone: row.ok ? 'default' : 'danger',
        cells: [
          <Stack key="at" spacing={0.25}>
            <Typography variant="body2">{ago(row.at)}</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {dateTime(row.at)}
            </Typography>
          </Stack>,
          <Stack key="who" spacing={0.25}>
            <Typography variant="subtitle2">{row.actor.name ?? row.actor.email ?? 'unknown'}</Typography>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              {row.actor.role && <RoleChip role={row.actor.role} />}
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {row.ip ?? ''}
              </Typography>
            </Stack>
          </Stack>,
          <Stack key="what" spacing={0.25} sx={{ maxWidth: 460 }}>
            <Typography variant="body2" sx={{ fontFamily: row.kind === 'auth' ? undefined : 'var(--font-geist-mono)', wordBreak: 'break-all' }}>
              {describe(row)}
            </Typography>
            {row.params && (
              <Typography variant="caption" sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>
                {Object.entries(row.params)
                  .map(([key, value]) => `${key}=${value}`)
                  .join(' · ')}
              </Typography>
            )}
            {row.body != null && (
              <Typography variant="caption" sx={{ color: 'text.disabled', wordBreak: 'break-all' }}>
                {JSON.stringify(row.body).slice(0, 240)}
              </Typography>
            )}
          </Stack>,
          row.permission && !row.permission.startsWith('@') ? (
            <Typography key="p" variant="caption" sx={{ fontFamily: 'var(--font-geist-mono)' }}>
              {row.permission}
            </Typography>
          ) : (
            '—'
          ),
          row.ok ? (
            <Label key="r" color="success" variant="soft">
              {row.status ?? 'ok'}
            </Label>
          ) : (
            <Label key="r" color="error" variant="soft">
              {row.errorCode ?? row.status ?? 'failed'}
            </Label>
          ),
        ],
      }))}
      empty="Nothing recorded for this filter."
    />
  );
}

export type ActivityQuery = { staffId: string; role: string; kind: string; failed: string; from: string; to: string; limit: number; offset: number };

export async function ActivityView({ query }: { query: ActivityQuery }) {
  const me = await currentStaff();
  if (!me) return null;
  const [log, people] = await Promise.all([
    adminGet<ActivityList>('/admin/staff/activity', {
      staffId: query.staffId || undefined,
      role: query.role || undefined,
      kind: query.kind || undefined,
      failed: query.failed === '1' ? '1' : undefined,
      from: query.from || undefined,
      to: query.to || undefined,
      limit: query.limit,
      offset: query.offset,
    }),
    adminGet<StaffList>('/admin/staff', { status: 'any', limit: 200 }),
  ]);

  return (
    <Stack spacing={3}>
      <FilterBar>
        <SelectFilter
          label="Person"
          param="staffId"
          value={query.staffId}
          options={[{ value: '', label: 'Everybody you can see' }, ...people.data.map(p => ({ value: p.id, label: `${p.name} (${p.role})` }))]}
          width={260}
        />
        {isTop(me) && (
          <SelectFilter
            label="Role"
            param="role"
            value={query.role}
            options={[
              { value: '', label: 'Every role' },
              { value: 'root', label: 'Owner key' },
              { value: 'admin', label: 'Admins' },
              { value: 'manager', label: 'Managers' },
              { value: 'agent', label: 'Agents' },
            ]}
            width={150}
          />
        )}
        <SelectFilter
          label="Kind"
          param="kind"
          value={query.kind}
          options={[
            { value: '', label: 'Everything' },
            { value: 'write', label: 'Changes' },
            { value: 'read', label: 'Views' },
            { value: 'auth', label: 'Sign-ins' },
          ]}
          width={150}
        />
        <SelectFilter
          label="Result"
          param="failed"
          value={query.failed}
          options={[
            { value: '', label: 'Any result' },
            { value: '1', label: 'Refused or failed only' },
          ]}
          width={200}
        />
      </FilterBar>
      <Panel
        title={isTop(me) ? 'Everything done on the admin surface' : 'You and your team'}
        subtitle={`${number(log.total)} entries`}
        note="Written by the API before each answer goes out — a page view, a change, a refusal, a sign-in. Passwords, codes and keys are never recorded. Views are kept six months; everything else two years."
        dense
      >
        <ActivityTable rows={log.data} />
        <OffsetPager total={log.total} offset={log.offset} limit={log.limit} />
      </Panel>
    </Stack>
  );
}

// ─── My account ──────────────────────────────────────────────────────────────

export async function AccountView() {
  const me = await currentStaff();
  if (!me) return null;
  if (me.kind === 'root') {
    return (
      <Panel title="Signed in with the admin key">
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          The key is the owner&apos;s recovery door, not an account: there is no password or authenticator to change here. Create an admin account on the Staff page and sign in with that
          day to day.
        </Typography>
      </Panel>
    );
  }
  const [catalogue, sessions, activity] = await Promise.all([
    adminGet<PermissionCatalogue>('/admin/staff/permissions'),
    adminGet<{ data: StaffSession[] }>('/admin/staff/me/sessions'),
    adminGet<ActivityList>('/admin/staff/me/activity', { limit: 20 }),
  ]);
  const labels = permissionLabels(catalogue);

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title={me.name} subtitle={me.email ?? undefined}>
            <Kv
              items={[
                { label: 'Role', value: <RoleChip role={me.role} /> },
                ...(me.manager ? [{ label: 'Manager', value: me.manager.name }] : []),
                { label: 'Authenticator', value: me.totpEnabled ? 'on' : 'not set up' },
                { label: 'Permissions', value: me.role === 'admin' ? 'everything' : String(me.effectivePermissions.length) },
              ]}
            />
            {me.role !== 'admin' && (
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mt: 2 }}>
                {me.effectivePermissions.map(p => (
                  <Label key={p} variant="soft" color="default">
                    {labels.get(p) ?? p}
                  </Label>
                ))}
              </Stack>
            )}
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="Change password" subtitle="Every other browser you are signed in on is signed out">
            <PasswordForm />
          </Panel>
        </Grid>
      </Grid>
      <Panel
        title="Where you are signed in"
        note="New phone for your authenticator? Ask whoever manages you to reset it; your next sign-in shows a new QR code."
        dense
      >
        <SessionsTable sessions={sessions.data} own />
      </Panel>
      <Panel title="Your recent activity" dense>
        <ActivityTable rows={activity.data} />
      </Panel>
    </Stack>
  );
}
