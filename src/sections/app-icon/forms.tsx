'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';

import { addIconWindow, chooseAppIcon, removeIconWindow, type IconActionState } from './actions';

/**
 * One button that sets the everyday icon, or switches a festive one on or
 * off by hand. A form of its own per button, so each tile answers for itself.
 */
export function IconChoiceButton({
  slot,
  icon,
  label,
  variant = 'outlined',
  color = 'inherit',
  disabled = false,
}: {
  slot: 'base' | 'festive';
  /** Empty with `festive` turns the hand-picked festive icon off. */
  icon: string;
  label: string;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'error';
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState<IconActionState, FormData>(chooseAppIcon, {});

  return (
    <Stack component="form" action={action} spacing={0.5} sx={{ alignItems: 'flex-start' }}>
      <input type="hidden" name="slot" value={slot} />
      <input type="hidden" name="icon" value={icon} />
      <Button type="submit" size="small" variant={variant} color={color} loading={pending} disabled={disabled}>
        {label}
      </Button>
      {state.error && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {state.error}
        </Typography>
      )}
    </Stack>
  );
}

/** A festive icon between two moments, in the panel's own zone. */
export function ScheduleWindowForm({ icons }: { icons: { key: string; label: string }[] }) {
  const [state, action, pending] = useActionState<IconActionState, FormData>(addIconWindow, {});

  return (
    <Stack component="form" action={action} spacing={2}>
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
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField select name="icon" label="Festive icon" defaultValue={icons[0]?.key ?? ''} fullWidth size="small" disabled={pending}>
            {icons.map(icon => (
              <MenuItem key={icon.key} value={icon.key}>
                {icon.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            name="startsAt"
            label="From"
            type="datetime-local"
            size="small"
            fullWidth
            required
            disabled={pending}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            name="endsAt"
            label="Until"
            type="datetime-local"
            size="small"
            fullWidth
            required
            disabled={pending}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField name="note" label="Note" placeholder="Diwali 2027" size="small" fullWidth disabled={pending} />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:calendar-add-bold-duotone" />}>
          Add to the schedule
        </Button>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Windows may not overlap. The icon goes back to the everyday one when the window closes.
        </Typography>
      </Stack>
    </Stack>
  );
}

export function RemoveWindowButton({ id, label }: { id: string; label: string }) {
  const [state, action, pending] = useActionState<IconActionState, FormData>(removeIconWindow, {});

  return (
    <Stack component="form" action={action} direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      <input type="hidden" name="id" value={id} />
      {state.error && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {state.error}
        </Typography>
      )}
      <Tooltip title={`Take ${label} off the schedule`}>
        <span>
          <IconButton type="submit" size="small" color="error" loading={pending} aria-label={`Remove ${label}`}>
            <Iconify icon="solar:trash-bin-minimalistic-bold-duotone" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
