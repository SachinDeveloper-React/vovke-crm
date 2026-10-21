'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { Label } from '@/src/components/label';
import type { TicketStatus } from '@/src/lib/types';

import { deleteTicket, replyToTicket, setTicketStatus, type SupportActionState } from './support-actions';

const STATUSES: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed — they cannot reply' },
];

/**
 * Answering a member.
 *
 * The status sits in the same form as the message, because "reply and
 * resolve" is one thing somebody does. Telling them is on by default: a
 * reply nobody is told about is a reply nobody reads — and the switch is
 * there for the case where somebody is already on the phone to them.
 */
export function ReplyForm({ id, status, closed }: { id: string; status: TicketStatus; closed: boolean }) {
  const [state, action, pending] = useActionState<SupportActionState, FormData>(replyToTicket, {});
  const [next, setNext] = useState<TicketStatus | ''>('');

  if (closed) {
    return (
      <Alert severity="info" variant="outlined">
        This ticket is closed, and a closed one is closed for the member too — their own reply route refuses it and
        tells them to open a new ticket. Reopen it below if the conversation is still going.
      </Alert>
    );
  }

  return (
    <Stack component="form" action={action} spacing={1.5}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="notifyMember" value="off" />
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

      <TextField
        name="message"
        label="Your reply"
        size="small"
        fullWidth
        multiline
        minRows={4}
        required
        disabled={pending}
        helperText="They read this in Help & Support, in the thread they opened."
      />

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <TextField
          select
          name="status"
          label="And set it to"
          size="small"
          value={next}
          onChange={event => setNext(event.target.value as TicketStatus | '')}
          disabled={pending}
          sx={{ width: 240 }}
          helperText={next === '' ? `Leave it — answering an open ticket marks it in progress` : undefined}
        >
          <MenuItem value="">{status === 'open' ? 'In progress (the default)' : 'Leave it as it is'}</MenuItem>
          {STATUSES.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={<Switch name="notifyMember" defaultChecked disabled={pending} />}
          label={<Typography variant="body2">Tell them</Typography>}
        />
        <Box sx={{ flex: 1 }} />
        <Button
          type="submit"
          variant="contained"
          loading={pending}
          startIcon={<Iconify icon="solar:plain-bold-duotone" />}
        >
          Send the reply
        </Button>
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        The notification goes through the same path every job uses, so their own switches decide whether a push follows
        the feed row — and the answer above says which it was.
      </Typography>
    </Stack>
  );
}

/** Moving the state without saying anything in the thread. */
export function StatusForm({ id, status }: { id: string; status: TicketStatus }) {
  const [state, action, pending] = useActionState<SupportActionState, FormData>(setTicketStatus, {});

  return (
    <Stack component="form" action={action} spacing={1}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="notifyMember" value="off" />
      {state.ok && (
        <Alert severity="success" variant="outlined" sx={{ py: 0 }}>
          <Typography variant="caption">{state.ok}</Typography>
        </Alert>
      )}
      {state.error && (
        <Alert severity="error" variant="outlined" sx={{ py: 0 }}>
          <Typography variant="caption">{state.error}</Typography>
        </Alert>
      )}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <TextField select name="status" label="State" size="small" defaultValue={status} disabled={pending} sx={{ width: 220 }}>
          {STATUSES.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField name="note" label="Note" size="small" disabled={pending} sx={{ width: 180 }} helperText="Audit row" />
        <FormControlLabel
          control={<Switch name="notifyMember" disabled={pending} />}
          label={<Typography variant="body2">Tell them</Typography>}
        />
        <Button type="submit" size="small" variant="outlined" loading={pending}>
          Set it
        </Button>
      </Stack>
    </Stack>
  );
}

/**
 * Deleting a ticket that should never have been one.
 *
 * The API refuses one support has replied to — that would take away the
 * member's own copy of what we told them — so this is for spam and
 * duplicates, and the panel says so rather than offering it as the way to
 * end a conversation.
 */
export function DeleteTicket({ id, reference, answered }: { id: string; reference: string; answered: boolean }) {
  const [state, action, pending] = useActionState<SupportActionState, FormData>(deleteTicket, {});

  return (
    <Stack component="form" action={action} spacing={1.5}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="reference" value={reference} />
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

      {answered ? (
        <Alert severity="info" variant="outlined">
          Support has replied to this one, so it cannot be deleted — that would take away the member’s copy of what we
          told them. Closing it is how a conversation ends.
        </Alert>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Nobody has answered this yet, so it can be removed outright — for spam, or a duplicate of the ticket next to
          it. For anything that is a real question, close it instead and the member keeps the thread.
        </Typography>
      )}

      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
        <TextField name="confirm" label={`Type ${reference}`} size="small" disabled={pending || answered} sx={{ width: 180 }} />
        <TextField name="reason" label="Why" size="small" disabled={pending || answered} sx={{ width: 200 }} />
        <Button
          type="submit"
          color="error"
          variant="outlined"
          loading={pending}
          disabled={answered}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
        >
          Delete it
        </Button>
      </Stack>
      {answered && (
        <Label color="default" variant="soft" sx={{ alignSelf: 'flex-start' }}>
          close it instead
        </Label>
      )}
    </Stack>
  );
}
