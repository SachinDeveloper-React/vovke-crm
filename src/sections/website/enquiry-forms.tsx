'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { DialogButton } from '@/src/components/ui/dialog-button';
import { Can } from '@/src/components/staff/staff-context';

import { deleteEnquiry, replyToEnquiry, updateEnquiry, type FormState } from './actions';
import type { EnquiryStatus } from './types';

const STATUSES: Array<{ value: EnquiryStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Being handled' },
  { value: 'replied', label: 'Answered' },
  { value: 'closed', label: 'Closed' },
  { value: 'spam', label: 'Spam' },
];

function Said({ state }: { state: FormState }) {
  if (state.ok) return <Alert severity="success" variant="outlined">{state.ok}</Alert>;
  if (state.error) return <Alert severity="error" variant="outlined">{state.error}</Alert>;
  return null;
}

export function EnquiryStatusForm({ id, status, note }: { id: string; status: EnquiryStatus; note: string | null }) {
  const [state, act, busy] = useActionState<FormState, FormData>(updateEnquiry, {});
  return (
    <Can permission="enquiries.reply" fallback={<Typography variant="body2">{note ?? 'No note.'}</Typography>}>
      <Stack component="form" action={act} spacing={2} key={`${status}:${note ?? ''}`}>
        <Said state={state} />
        <input type="hidden" name="id" value={id} />
        <TextField name="status" select size="small" label="State" defaultValue={status} disabled={busy}>
          {STATUSES.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField name="note" size="small" label="Team note" multiline minRows={3} defaultValue={note ?? ''} disabled={busy} />
        <Button type="submit" variant="outlined" color="inherit" loading={busy} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          Save
        </Button>
      </Stack>
    </Can>
  );
}

/**
 * Answering: by email from here, or — when the answer went out some other
 * way (a call, the support mailbox) — written down, so the message shows as
 * handled and the next person does not answer it twice.
 */
export function EnquiryReplyForm({ id, name, emailConfigured, disabled }: { id: string; name: string; emailConfigured: boolean; disabled: boolean }) {
  const [state, act, busy] = useActionState<FormState, FormData>(replyToEnquiry, {});
  const [message, setMessage] = useState('');
  const [send, setSend] = useState<'email' | 'log'>(emailConfigured ? 'email' : 'log');
  const [sentFor, setSentFor] = useState<FormState | null>(null);

  // A successful answer empties the box, once.
  if (state.ok && sentFor !== state) {
    setSentFor(state);
    setMessage('');
  }

  return (
    <Can permission="enquiries.reply">
      <Stack component="form" action={act} spacing={1.5} sx={{ pt: 1 }}>
        <Said state={state} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="send" value={send} />
        <TextField
          name="message"
          label={send === 'email' ? `Your answer to ${name}` : 'What they were told'}
          multiline
          minRows={4}
          required
          value={message}
          onChange={event => setMessage(event.target.value)}
          disabled={busy || disabled}
          helperText={
            send === 'email'
              ? 'Sent as plain text, starting “Hi ' + name + ',” and signed with the company name, with their message quoted below.'
              : 'Nothing is emailed. The message is marked answered.'
          }
        />
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <TextField
            select
            size="small"
            label="How"
            value={send}
            onChange={event => setSend(event.target.value as 'email' | 'log')}
            disabled={busy || disabled}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="email" disabled={!emailConfigured}>
              Email it from here{emailConfigured ? '' : ' (email not set up)'}
            </MenuItem>
            <MenuItem value="log">Write down an answer given elsewhere</MenuItem>
          </TextField>
          <Button
            type="submit"
            variant="contained"
            loading={busy}
            disabled={disabled || message.trim().length < 2}
            startIcon={<Iconify icon={send === 'email' ? 'solar:plain-bold-duotone' : 'solar:pen-bold-duotone'} />}
          >
            {send === 'email' ? 'Send answer' : 'Log answer'}
          </Button>
        </Stack>
        {disabled && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Marked as spam. Change its state first if it is a real message.
          </Typography>
        )}
      </Stack>
    </Can>
  );
}

export function DeleteEnquiryButton({ id }: { id: string }) {
  const [state, act, busy] = useActionState<FormState, FormData>(deleteEnquiry, {});
  return (
    <Can permission="enquiries.delete">
      <DialogButton
        label="Delete"
        icon="solar:trash-bin-trash-bold-duotone"
        color="error"
        title="Delete this message?"
        subtitle="Their words and every answer go with it. Use it for spam, or when somebody asks to be forgotten."
      >
        <Stack component="form" action={act} spacing={2} sx={{ pt: 1 }}>
          <Said state={state} />
          <input type="hidden" name="id" value={id} />
          <Button type="submit" color="error" variant="contained" loading={busy}>
            Delete for good
          </Button>
        </Stack>
      </DialogButton>
    </Can>
  );
}
