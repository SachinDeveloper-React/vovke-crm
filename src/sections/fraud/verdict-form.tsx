'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';

import { decideFlag, rescoreDay, type ActionState } from './actions';

/**
 * The verdict, with the note that explains it and a second click before
 * anything is voided.
 *
 * A queue must never make it easier to punish than to check, so confirming
 * takes two deliberate actions and the evidence stays on screen for both.
 */
export function VerdictForm({ flagId, userId, status }: { flagId: string; userId: string; status: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(decideFlag, {});
  const [arming, setArming] = useState(false);

  if (state.ok) {
    return (
      <Alert severity="success" variant="outlined" sx={{ mt: 1 }}>
        {state.ok}
      </Alert>
    );
  }

  return (
    <Stack component="form" action={action} spacing={1} sx={{ mt: 1.5 }}>
      <input type="hidden" name="flagId" value={flagId} />
      <input type="hidden" name="userId" value={userId} />

      {state.error && (
        <Alert severity="error" variant="outlined">
          {state.error}
        </Alert>
      )}

      <TextField
        name="note"
        size="small"
        placeholder="Why — kept on the flag and in the audit log"
        fullWidth
        disabled={pending}
      />

      {arming ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'error.main' }}>
            This voids the coins the day is still holding. It cannot be undone from here.
          </Typography>
          <Button
            type="submit"
            name="verdict"
            value="confirm"
            size="small"
            color="error"
            variant="contained"
            loading={pending}
          >
            Yes, confirm the fraud
          </Button>
          <Button size="small" color="inherit" onClick={() => setArming(false)} disabled={pending}>
            Cancel
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            size="small"
            color="error"
            variant="outlined"
            onClick={() => setArming(true)}
            disabled={pending || status !== 'open'}
            startIcon={<Iconify icon="solar:shield-cross-bold-duotone" />}
          >
            Confirm
          </Button>
          <Button
            type="submit"
            name="verdict"
            value="dismiss"
            size="small"
            variant="outlined"
            loading={pending}
            disabled={status !== 'open'}
            startIcon={<Iconify icon="solar:shield-check-bold-duotone" />}
          >
            Dismiss
          </Button>
          {status !== 'open' && (
            <Typography variant="caption" sx={{ color: 'text.disabled', alignSelf: 'center' }}>
              Already {status} — a verdict is given once.
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
}

/** Re-score one day from the evidence already stored. */
export function RescoreForm({ userId, localDay }: { userId: string; localDay: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(rescoreDay, {});

  return (
    <Stack component="form" action={action} spacing={0.5}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="localDay" value={localDay} />
      <Button type="submit" size="small" variant="text" loading={pending} sx={{ minWidth: 0 }}>
        Re-score
      </Button>
      {state.ok && (
        <Typography variant="caption" sx={{ color: 'success.main', maxWidth: 220 }}>
          {state.ok}
        </Typography>
      )}
      {state.error && (
        <Typography variant="caption" sx={{ color: 'error.main', maxWidth: 220 }}>
          {state.error}
        </Typography>
      )}
    </Stack>
  );
}
