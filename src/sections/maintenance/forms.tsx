'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';

import { addTester, removeTester, saveMaintenance, type MaintenanceActionState } from './actions';


function Said({ state }: { state: MaintenanceActionState }) {
  return (
    <>
      {state.ok && (
        <Alert severity="success" variant="outlined">
          {state.ok}
        </Alert>
      )}
      {state.error && (
        <Alert severity="error" variant="outlined">
          {state.error}
        </Alert>
      )}
    </>
  );
}

/**
 * The words on the maintenance screen, and — for `on` — the switch itself.
 *
 * `on` lives in a dialog behind a red button: it stops every member at once,
 * so it is two presses and the second one says exactly that. `update`
 * rewords maintenance that is already on; phones pick the new words up on
 * their next half-minute check.
 */
export function MaintenanceForm({
  intent,
  title,
  message,
  endsAt,
}: {
  intent: 'on' | 'update';
  title: string;
  message: string;
  /** `datetime-local` value in the panel's zone, or empty. */
  endsAt: string;
}) {
  const [state, action, pending] = useActionState<MaintenanceActionState, FormData>(saveMaintenance, {});

  return (
    <Stack component="form" action={action} spacing={2}>
      <Said state={state} />
      <input type="hidden" name="intent" value={intent} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            name="title"
            label="Title"
            defaultValue={title}
            fullWidth
            size="small"
            required
            disabled={pending}
            slotProps={{ htmlInput: { maxLength: 80 } }}
            helperText="The heading on the maintenance screen"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            name="endsAt"
            label="Expected back by"
            type="datetime-local"
            defaultValue={endsAt}
            fullWidth
            size="small"
            disabled={pending}
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="Optional — shown to members, never acted on"
          />
        </Grid>
        <Grid size={12}>
          <TextField
            name="message"
            label="Message"
            defaultValue={message}
            fullWidth
            size="small"
            required
            multiline
            minRows={2}
            disabled={pending}
            slotProps={{ htmlInput: { maxLength: 400 } }}
            helperText="What is happening, in a sentence a member understands"
          />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        {intent === 'on' ? (
          <Button
            type="submit"
            variant="contained"
            color="error"
            loading={pending}
            startIcon={<Iconify icon="solar:shield-warning-bold-duotone" />}
          >
            Turn maintenance on now
          </Button>
        ) : (
          <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:pen-bold-duotone" />}>
            Save the words
          </Button>
        )}
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {intent === 'on'
            ? 'Every member is stopped at once. Testers and staff carry on, with a strip saying maintenance is on.'
            : 'Phones on the maintenance screen show the new words within half a minute.'}
        </Typography>
      </Stack>
    </Stack>
  );
}

/** Ends maintenance. One press: letting members back in is never the dangerous direction. */
export function TurnOffButton() {
  const [state, action, pending] = useActionState<MaintenanceActionState, FormData>(saveMaintenance, {});

  return (
    <Stack component="form" action={action} spacing={1} sx={{ alignItems: 'flex-start' }}>
      <input type="hidden" name="intent" value="off" />
      <Button
        type="submit"
        variant="contained"
        color="success"
        loading={pending}
        startIcon={<Iconify icon="solar:check-circle-bold-duotone" />}
      >
        Turn maintenance off
      </Button>
      <Said state={state} />
    </Stack>
  );
}

/** A tester, by whatever the person asking gave: an email, a phone number, a member id. */
export function AddTesterForm() {
  const [state, action, pending] = useActionState<MaintenanceActionState, FormData>(addTester, {});

  return (
    <Stack component="form" action={action} spacing={1.5}>
      <Said state={state} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'flex-start' } }}>
        <TextField
          name="identifier"
          label="Email, phone or member id"
          placeholder="asha@example.com"
          size="small"
          fullWidth
          required
          disabled={pending}
          helperText="The account they sign in to the app with"
        />
        <Button
          type="submit"
          variant="outlined"
          loading={pending}
          startIcon={<Iconify icon="solar:user-plus-bold-duotone" />}
          sx={{ flexShrink: 0, mt: { sm: 0.25 } }}
        >
          Add tester
        </Button>
      </Stack>
    </Stack>
  );
}

export function RemoveTesterButton({ id, label }: { id: string; label: string }) {
  const [state, action, pending] = useActionState<MaintenanceActionState, FormData>(removeTester, {});

  return (
    <Stack component="form" action={action} direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      <input type="hidden" name="id" value={id} />
      {state.error && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {state.error}
        </Typography>
      )}
      <Tooltip title={`Take ${label} off the list`}>
        <span>
          <IconButton type="submit" size="small" color="error" loading={pending} aria-label={`Remove ${label}`}>
            <Iconify icon="solar:trash-bin-minimalistic-bold-duotone" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
