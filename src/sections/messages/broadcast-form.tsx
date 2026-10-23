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
import { number } from '@/src/lib/format';

import { sendBroadcast, type BroadcastState } from './actions';

const TOPICS = ['system', 'steps', 'coins', 'challenge', 'reward', 'health', 'hydration', 'streak', 'workout'] as const;

/** The member's own eight consent switches, as their settings screen lists them. */
const SWITCHES = [
  'activity',
  'coins',
  'challenges',
  'orders',
  'offers',
  'announcements',
  'referrals',
  'health',
] as const;

/**
 * The send itself.
 *
 * The segment comes in as props because it lives in the URL — the count on
 * screen was read from the same filters, and both go out with the message so
 * the API can refuse a segment that has moved underneath it.
 *
 * Two deliberate frictions: the confirmation is its own tick, and the button
 * says the number out loud. Nothing here can be taken back.
 */
export function BroadcastForm({
  segment,
  matched,
  overflow,
  ceiling,
}: {
  segment: { tier: string; platform: string; seenWithinDays: string; notSeenForDays: string; pushableOnly: boolean };
  matched: number;
  overflow: boolean;
  ceiling: number;
}) {
  const [state, action, pending] = useActionState<BroadcastState, FormData>(sendBroadcast, {});
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Stack component="form" action={action} spacing={2}>
      {/* The segment as read, so the send and the count cannot disagree. */}
      <input type="hidden" name="tier" value={segment.tier} />
      <input type="hidden" name="platform" value={segment.platform} />
      <input type="hidden" name="seenWithinDays" value={segment.seenWithinDays} />
      <input type="hidden" name="notSeenForDays" value={segment.notSeenForDays} />
      {segment.pushableOnly && <input type="hidden" name="pushableOnly" value="on" />}
      <input type="hidden" name="expected" value={matched} />
      <input type="hidden" name="suppressPush" value="off" />

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
      {overflow && (
        <Alert severity="warning" variant="outlined">
          That segment is bigger than one send will take. The first {number(ceiling)} will get it — narrow the filters,
          or treat this as a campaign and plan it.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select name="topic" label="Topic" size="small" fullWidth defaultValue="system" disabled={pending}>
            {TOPICS.map(topic => (
              <MenuItem key={topic} value={topic}>
                {topic}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          {/*
            Which of the member's own eight switches decides whether this is
            pushed. Left on "the topic decides" it behaves like every job.
            It matters for a promotion: no topic maps to `offers`, so one
            sent on `system` was governed by *announcements* and reached
            members who had switched offers off — the switch was on their
            screen and silenced nothing.
          */}
          <TextField
            select
            name="preference"
            label="Governed by"
            size="small"
            fullWidth
            defaultValue=""
            disabled={pending}
            helperText="Which switch can silence it"
          >
            <MenuItem value="">The topic decides</MenuItem>
            {SWITCHES.map(key => (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField name="title" label="Title" size="small" fullWidth required disabled={pending} slotProps={{ htmlInput: { maxLength: 120 } }} />
        </Grid>
        <Grid size={12}>
          <TextField
            name="message"
            label="Message"
            size="small"
            fullWidth
            required
            multiline
            minRows={3}
            disabled={pending}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            helperText="Written to every one of their notification centres. The push follows each member's own switch."
          />
        </Grid>
        <Grid size={12}>
          <TextField name="reason" label="Why this is going out (required)" size="small" fullWidth required disabled={pending} />
        </Grid>
        <Grid size={12}>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <FormControlLabel
              control={<Switch name="suppressPush" disabled={pending} />}
              label={<Typography variant="body2">Notification centre only — no push</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  name="confirm"
                  checked={confirmed}
                  onChange={event => setConfirmed(event.target.checked)}
                  disabled={pending}
                  color="error"
                />
              }
              label={
                <Typography variant="body2">
                  I have read the count: this goes to {number(matched)} member{matched === 1 ? '' : 's'}
                </Typography>
              }
            />
          </Stack>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Button
            type="submit"
            variant="contained"
            color="error"
            loading={pending}
            disabled={!confirmed || matched === 0}
            startIcon={<Iconify icon="solar:plain-bold-duotone" />}
          >
            Send to {number(matched)}
          </Button>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          A message in {number(matched)} notification centres cannot be recalled. Nobody who has switched that category
          off will be pushed — they still get the row.
        </Typography>
      </Stack>
    </Stack>
  );
}
