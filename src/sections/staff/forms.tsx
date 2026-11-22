'use client';

import { useActionState, useMemo, useState, type ReactNode } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';

import {
  changeStaffRole, createStaff, deleteStaff, reactivateStaff, reassignStaff, resetStaffPassword, resetStaffTotp, saveStaff, signOutStaff,
  suspendStaff, type StaffFormState,
} from './actions';
import type { PermissionCatalogue, StaffRole, StaffView } from './types';

function Result({ state }: { state: StaffFormState }) {
  return (
    <>
      {state.error && (
        <Alert severity="error" variant="outlined">
          {state.error}
        </Alert>
      )}
      {state.ok && (
        <Alert severity="success" variant="outlined">
          {state.ok}
        </Alert>
      )}
      {state.temporaryPassword && <TemporaryPassword email={state.email} password={state.temporaryPassword} />}
    </>
  );
}

/** Shown once, to hand over in person or over a private channel. */
function TemporaryPassword({ email, password }: { email?: string; password: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Box sx={{ p: 2, borderRadius: 1.5, border: '1px dashed', borderColor: 'warning.main', bgcolor: 'background.neutral' }}>
      {email && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          Email: {email}
        </Typography>
      )}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-geist-mono)', letterSpacing: 1 }}>
          {password}
        </Typography>
        <Button
          size="small"
          onClick={() => {
            void navigator.clipboard?.writeText(password).then(() => setCopied(true));
          }}
          startIcon={<Iconify icon="solar:copy-bold-duotone" />}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        It will not be shown again. They will set their own password and an authenticator at first sign-in.
      </Typography>
    </Box>
  );
}

/**
 * The permission boxes, grouped as the menu is, with presets to start from.
 *
 * `allowed` is what may be ticked at all — for an agent, what their manager
 * holds right now and agents may hold; for a manager, everything. A box
 * outside it is shown, disabled, with the reason: hiding it would leave
 * "why can't my agent do X" without an answer on the screen.
 */
export function PermissionPicker({
  catalogue,
  role,
  allowed,
  selected: initial,
  managerName,
}: {
  catalogue: PermissionCatalogue;
  role: 'manager' | 'agent';
  allowed: string[] | null;
  selected: string[];
  managerName?: string | null;
}) {
  const allowedSet = useMemo(() => (allowed ? new Set(allowed) : null), [allowed]);
  const [selected, setSelected] = useState(() => new Set(initial));
  const canTick = (key: string, agentGrantable: boolean) => (role === 'manager' || agentGrantable) && (!allowedSet || allowedSet.has(key));

  const applyPreset = (key: string) => {
    const preset = catalogue.presets.find(p => p.key === key);
    if (!preset) return;
    setSelected(new Set(preset.permissions.filter(p => !allowedSet || allowedSet.has(p))));
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
        <TextField select size="small" label="Start from a preset" defaultValue="" onChange={event => applyPreset(event.target.value)} sx={{ minWidth: 220 }}>
          <MenuItem value="" disabled>
            Choose…
          </MenuItem>
          {catalogue.presets
            .filter(preset => preset.forRole.includes(role))
            .map(preset => (
              <MenuItem key={preset.key} value={preset.key}>
                {preset.label}
              </MenuItem>
            ))}
        </TextField>
        <Button size="small" onClick={() => setSelected(new Set())}>
          Clear all
        </Button>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {selected.size} ticked
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        {catalogue.groups.map(group => {
          const visible = group.permissions.filter(p => role === 'manager' || p.agentGrantable);
          if (visible.length === 0) return null;
          return (
            <Grid key={group.key} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                {group.label}
              </Typography>
              <Stack>
                {visible.map(permission => {
                  const enabled = canTick(permission.key, permission.agentGrantable);
                  const box = (
                    <FormControlLabel
                      key={permission.key}
                      disabled={!enabled}
                      control={
                        <Checkbox
                          size="small"
                          name="permissions"
                          value={permission.key}
                          checked={selected.has(permission.key) && enabled}
                          onChange={event => {
                            const next = new Set(selected);
                            if (event.target.checked) next.add(permission.key);
                            else next.delete(permission.key);
                            setSelected(next);
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ color: enabled ? 'text.primary' : 'text.disabled' }}>
                          {permission.label}
                        </Typography>
                      }
                    />
                  );
                  return enabled ? (
                    box
                  ) : (
                    <Tooltip key={permission.key} title={`${managerName ?? 'Their manager'} does not hold this, so their agent cannot.`} placement="top-start">
                      <span>{box}</span>
                    </Tooltip>
                  );
                })}
              </Stack>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}

/**
 * A new account. What can be created depends on who is creating it: an
 * admin, any role; a manager, agents under themselves — the API enforces the
 * same, this only offers the choices that will be accepted.
 */
export function CreateStaffForm({
  catalogue,
  myRole,
  myId,
  myPermissions,
  managers,
}: {
  catalogue: PermissionCatalogue;
  myRole: 'root' | StaffRole;
  myId: string;
  myPermissions: string[];
  managers: StaffView[];
}) {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(createStaff, {});
  const top = myRole === 'root' || myRole === 'admin';
  const roles: StaffRole[] = top ? ['agent', 'manager', 'admin'] : ['agent'];
  const [role, setRole] = useState<StaffRole>(roles[0]!);
  const [managerId, setManagerId] = useState<string>(top ? (managers[0]?.id ?? '') : myId);
  const manager = top ? managers.find(m => m.id === managerId) : null;
  const allowed = role === 'agent' ? (top ? (manager?.effectivePermissions ?? []) : myPermissions) : null;

  if (state.temporaryPassword) {
    return (
      <Stack spacing={2}>
        <Result state={state} />
        <Box>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Done
          </Button>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack component="form" action={action} spacing={2}>
      <Result state={state} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="name" label="Full name" required fullWidth size="small" disabled={pending} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="email" label="Work email" type="email" required fullWidth size="small" disabled={pending} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            name="role"
            label="Role"
            value={role}
            onChange={event => setRole(event.target.value as StaffRole)}
            fullWidth
            size="small"
            disabled={pending || roles.length === 1}
          >
            {roles.map(r => (
              <MenuItem key={r} value={r}>
                {r === 'admin' ? 'Admin — everything, including other admins' : r === 'manager' ? 'Manager — what you tick, plus a team' : 'Agent — what you tick, under a manager'}
              </MenuItem>
            ))}
          </TextField>
          {roles.length === 1 && <input type="hidden" name="role" value="agent" />}
        </Grid>
        {role === 'agent' && top && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              name="managerId"
              label="Manager"
              value={managerId}
              onChange={event => setManagerId(event.target.value)}
              fullWidth
              size="small"
              required
              disabled={pending}
              helperText={managers.length === 0 ? 'Create a manager first: every agent answers to one.' : 'The agent can hold only what this manager holds.'}
            >
              {managers.map(m => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name} · {m.email}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}
      </Grid>

      {role === 'admin' ? (
        <Alert severity="info" variant="outlined">
          An admin holds every permission, can create and manage managers and agents, and can change anybody&apos;s role. Give it sparingly.
        </Alert>
      ) : (
        <PermissionPicker key={`${role}:${managerId}`} catalogue={catalogue} role={role} allowed={allowed} selected={[]} managerName={top ? manager?.name : 'You'} />
      )}

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:user-plus-bold-duotone" />}>
          Create the account
        </Button>
      </Box>
    </Stack>
  );
}

/** Name and permissions of one person. */
export function EditStaffForm({ staff, catalogue, allowed }: { staff: StaffView; catalogue: PermissionCatalogue; allowed: string[] | null }) {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(saveStaff, {});
  return (
    <Stack component="form" action={action} spacing={2}>
      <Result state={state} />
      <input type="hidden" name="staffId" value={staff.id} />
      <TextField name="name" label="Full name" defaultValue={staff.name} size="small" sx={{ maxWidth: 360 }} disabled={pending} />
      {staff.role !== 'admin' && (
        <>
          <input type="hidden" name="editPermissions" value="yes" />
          <PermissionPicker
            catalogue={catalogue}
            role={staff.role}
            allowed={allowed}
            selected={staff.permissions}
            managerName={staff.manager?.name}
          />
        </>
      )}
      <Box>
        <Button type="submit" variant="contained" loading={pending}>
          Save
        </Button>
      </Box>
    </Stack>
  );
}

/** A button that runs one action against one person, with its answer underneath. */
function ActionForm({
  staffId,
  action: run,
  label,
  color = 'inherit',
  icon,
  children,
}: {
  staffId: string;
  action: (previous: StaffFormState, form: FormData) => Promise<StaffFormState>;
  label: string;
  color?: 'inherit' | 'error' | 'warning' | 'primary';
  icon?: string;
  children?: ReactNode;
}) {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(run, {});
  return (
    <Stack component="form" action={action} spacing={1.5}>
      <input type="hidden" name="staffId" value={staffId} />
      {children}
      <Box>
        <Button type="submit" variant="outlined" color={color} size="small" loading={pending} startIcon={icon ? <Iconify icon={icon} /> : undefined}>
          {label}
        </Button>
      </Box>
      <Result state={state} />
    </Stack>
  );
}

export function SuspendForm({ staff }: { staff: StaffView }) {
  if (staff.status === 'suspended') {
    return <ActionForm staffId={staff.id} action={reactivateStaff} label="Reactivate" color="primary" icon="solar:play-circle-bold-duotone" />;
  }
  return (
    <ActionForm staffId={staff.id} action={suspendStaff} label="Suspend" color="warning" icon="solar:pause-circle-bold-duotone">
      <TextField name="reason" label="Why (kept on the record)" required size="small" fullWidth slotProps={{ htmlInput: { minLength: 3, maxLength: 300 } }} />
      {staff.role === 'manager' && (
        <Typography variant="caption" sx={{ color: 'warning.main' }}>
          Their agents are blocked too, until they are moved to another manager or this one is reactivated.
        </Typography>
      )}
    </ActionForm>
  );
}

export function ResetPasswordForm({ staffId }: { staffId: string }) {
  return <ActionForm staffId={staffId} action={resetStaffPassword} label="Reset password" icon="solar:key-minimalistic-bold-duotone" />;
}

export function ResetTotpForm({ staffId }: { staffId: string }) {
  return <ActionForm staffId={staffId} action={resetStaffTotp} label="Reset authenticator" icon="solar:shield-keyhole-bold-duotone" />;
}

export function SignOutEverywhereForm({ staffId }: { staffId: string }) {
  return <ActionForm staffId={staffId} action={signOutStaff} label="Sign out everywhere" icon="solar:logout-2-bold-duotone" />;
}

export function ReassignForm({ staff, managers }: { staff: StaffView; managers: StaffView[] }) {
  const options = managers.filter(m => m.id !== staff.manager?.id);
  return (
    <ActionForm staffId={staff.id} action={reassignStaff} label="Move to this manager" icon="solar:transfer-horizontal-bold-duotone">
      <TextField select name="managerId" label="New manager" required size="small" fullWidth defaultValue={options[0]?.id ?? ''}>
        {options.map(m => (
          <MenuItem key={m.id} value={m.id}>
            {m.name} · {m.email}
          </MenuItem>
        ))}
      </TextField>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Permissions the new manager does not hold are dropped.
      </Typography>
    </ActionForm>
  );
}

export function RoleForm({ staff, managers }: { staff: StaffView; managers: StaffView[] }) {
  const [role, setRole] = useState<StaffRole>(staff.role === 'agent' ? 'manager' : staff.role === 'manager' ? 'admin' : 'manager');
  return (
    <ActionForm staffId={staff.id} action={changeStaffRole} label="Change role" icon="solar:ranking-bold-duotone">
      <TextField select name="role" label="New role" size="small" fullWidth value={role} onChange={event => setRole(event.target.value as StaffRole)}>
        {(['admin', 'manager', 'agent'] as const)
          .filter(r => r !== staff.role)
          .map(r => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
      </TextField>
      {role === 'agent' && (
        <TextField select name="managerId" label="Their manager" required size="small" fullWidth defaultValue={managers.find(m => m.id !== staff.id)?.id ?? ''}>
          {managers
            .filter(m => m.id !== staff.id)
            .map(m => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
        </TextField>
      )}
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        They are signed out to pick up the new role. A manager with agents must hand them over first.
      </Typography>
    </ActionForm>
  );
}

export function DeleteStaffForm({ staff }: { staff: StaffView }) {
  return (
    <ActionForm staffId={staff.id} action={deleteStaff} label="Delete the account" color="error" icon="solar:trash-bin-trash-bold-duotone">
      <input type="hidden" name="email" value={staff.email} />
      <TextField name="confirm" label={`Type ${staff.email} to confirm`} required size="small" fullWidth autoComplete="off" />
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        They are signed out at once and the email is freed. Their activity stays on the log under their name.
      </Typography>
    </ActionForm>
  );
}
