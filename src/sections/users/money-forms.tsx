'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { coins as formatCoins } from '@/src/lib/format';

import { adjustCoins, setStatus, type MoneyActionState } from './money-actions';

/**
 * Credit or claw back coins.
 *
 * The direction is a choice rather than a minus sign in a number field: "-500"
 * typed into a box that usually means a credit is how somebody takes 500 coins
 * off a member they meant to pay. Clawing back also arms a second click, and
 * the form says what the balance is while it asks.
 */
export function AdjustCoinsForm({ userId, balance }: { userId: string; balance: number }) {
  const [state, action, pending] = useActionState<MoneyActionState, FormData>(adjustCoins, {});
  const [direction, setDirection] = useState('credit');
  const [arming, setArming] = useState(false);

  return (
    <Stack component="form" action={action} spacing={2}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="direction" value={direction} />

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
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            label="Direction"
            size="small"
            fullWidth
            value={direction}
            disabled={pending}
            onChange={event => {
              setDirection(event.target.value);
              setArming(false);
            }}
          >
            <MenuItem value="credit">Credit — give coins</MenuItem>
            <MenuItem value="clawback">Claw back — take coins</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            name="amount"
            label="Coins"
            type="number"
            size="small"
            fullWidth
            required
            disabled={pending}
            slotProps={{ htmlInput: { min: 1, max: 10_000, step: 1 } }}
            helperText={direction === 'clawback' ? `They hold ${formatCoins(balance)}` : 'Up to 10,000 in one go'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            name="title"
            label="What the member sees"
            size="small"
            fullWidth
            required
            disabled={pending}
            defaultValue={direction === 'clawback' ? 'Correction' : 'Goodwill credit'}
            slotProps={{ htmlInput: { maxLength: 80 } }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            name="reason"
            label="Why (kept on the audit row)"
            size="small"
            fullWidth
            required
            disabled={pending}
            placeholder="Ticket number, or the day the fraud was confirmed"
            slotProps={{ htmlInput: { maxLength: 300 } }}
          />
        </Grid>
      </Grid>

      {direction === 'clawback' && arming ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'error.main' }}>
            This writes a negative row against their wallet. It cannot be undone — only compensated by another row.
          </Typography>
          <Button type="submit" size="small" color="error" variant="contained" loading={pending}>
            Yes, take the coins
          </Button>
          <Button size="small" color="inherit" disabled={pending} onClick={() => setArming(false)}>
            Cancel
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          {direction === 'clawback' ? (
            <Button
              size="small"
              color="error"
              variant="outlined"
              disabled={pending}
              onClick={() => setArming(true)}
              startIcon={<Iconify icon="solar:arrow-left-down-bold-duotone" />}
            >
              Claw back
            </Button>
          ) : (
            <Button
              type="submit"
              variant="contained"
              loading={pending}
              startIcon={<Iconify icon="solar:arrow-right-up-bold-duotone" />}
            >
              Credit the coins
            </Button>
          )}
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Either way it is a new ledger row the member can see, with your name on it. A credit skips the daily
            ceiling — a correction is not earnings.
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

/** Frozen, and the legal hold. Both need a reason; both are audited. */
export function StatusForm({
  userId,
  frozen,
  legalHold,
  deleted,
}: {
  userId: string;
  frozen: boolean;
  legalHold: boolean;
  deleted: boolean;
}) {
  const [state, action, pending] = useActionState<MoneyActionState, FormData>(setStatus, {});

  if (deleted) {
    return (
      <Alert severity="info" variant="outlined">
        This account has been deleted and anonymised. There is nothing left to freeze.
      </Alert>
    );
  }

  return (
    <Stack component="form" action={action} spacing={2}>
      <input type="hidden" name="userId" value={userId} />
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

      {/*
        An unchecked switch submits nothing at all, so without these a form
        could turn a flag on and never off again. The hidden field ahead of
        each switch always sends `off`; a checked switch adds `on` after it,
        and the action reads the last value.
      */}
      <input type="hidden" name="frozen" value="off" />
      <input type="hidden" name="legalHold" value="off" />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControlLabel
          control={<Switch name="frozen" defaultChecked={frozen} disabled={pending} color="error" />}
          label={
            <Box>
              <Typography variant="body2">Frozen</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Stops spending. Days, badges and history are untouched.
              </Typography>
            </Box>
          }
        />
        <FormControlLabel
          control={<Switch name="legalHold" defaultChecked={legalHold} disabled={pending} color="warning" />}
          label={
            <Box>
              <Typography variant="body2">Legal hold</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Keeps the account out of the deletion job’s way.
              </Typography>
            </Box>
          }
        />
      </Stack>

      <TextField
        name="reason"
        label="Why (required, kept on the audit row)"
        size="small"
        fullWidth
        required
        disabled={pending}
        slotProps={{ htmlInput: { maxLength: 300 } }}
      />

      <Box>
        <Button type="submit" variant="contained" color="warning" loading={pending} startIcon={<Iconify icon="solar:lock-bold-duotone" />}>
          Save account state
        </Button>
      </Box>
    </Stack>
  );
}
