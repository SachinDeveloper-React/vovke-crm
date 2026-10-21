'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { number } from '@/src/lib/format';

import { deleteNotification, retractBroadcast, type NotificationActionState } from './notification-actions';

function Said({ state }: { state: NotificationActionState }) {
  if (!state.ok && !state.error) return null;
  return (
    <Alert severity={state.error ? 'error' : 'success'} variant="outlined" sx={{ py: 0 }}>
      <Typography variant="caption">{state.error ?? state.ok}</Typography>
    </Alert>
  );
}

/**
 * One row out of one feed.
 *
 * The reason box is the form rather than a confirmation step: what stops a
 * mis-click is having to type something, and what is typed is kept — this is
 * somebody's notification centre changing without them asking.
 */
export function DeleteNotification({ id, pushPending }: { id: string; pushPending: boolean }) {
  const [state, action, pending] = useActionState<NotificationActionState, FormData>(deleteNotification, {});

  return (
    <Stack component="form" action={action} spacing={0.75} sx={{ minWidth: 220 }}>
      <input type="hidden" name="id" value={id} />
      <Said state={state} />
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <TextField
          name="reason"
          label="Why"
          size="small"
          disabled={pending}
          sx={{ flex: 1 }}
          placeholder={pushPending ? 'cancel the held push' : 'sent in error'}
        />
        <Button type="submit" size="small" color="error" variant="outlined" loading={pending}>
          {pushPending ? 'Cancel' : 'Remove'}
        </Button>
      </Stack>
    </Stack>
  );
}

/**
 * Taking a broadcast back.
 *
 * Only as far as it can be taken: the rows nobody has opened. The count of
 * what cannot be touched is on the button itself, because that is the number
 * somebody needs before deciding — a retraction that reaches nobody is worth
 * knowing about before it is made.
 */
export function RetractBroadcast({ dedupeKey, retractable, read }: { dedupeKey: string; retractable: number; read: number }) {
  const [state, action, pending] = useActionState<NotificationActionState, FormData>(retractBroadcast, {});

  return (
    <Stack component="form" action={action} spacing={0.75} sx={{ minWidth: 260 }}>
      <input type="hidden" name="dedupeKey" value={dedupeKey} />
      <Said state={state} />
      {retractable === 0 ? (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Nothing left to take back — every row has been opened, or removed already.
        </Typography>
      ) : (
        <>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
            <TextField name="confirm" label="Type retract" size="small" disabled={pending} sx={{ width: 130 }} />
            <TextField name="reason" label="Why" size="small" disabled={pending} sx={{ flex: 1, minWidth: 120 }} />
            <Button
              type="submit"
              size="small"
              color="error"
              variant="outlined"
              loading={pending}
              startIcon={<Iconify icon="solar:undo-left-round-bold-duotone" />}
            >
              Retract {number(retractable)}
            </Button>
          </Stack>
          {read > 0 && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {number(read)} opened it and will keep theirs: a message deleted after it was read makes the member who
              asks about it look mistaken.
            </Typography>
          )}
        </>
      )}
    </Stack>
  );
}
