'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { Label } from '@/src/components/label';
import type { MemberConfig } from '@/src/lib/types';

import {
  nudgeMemberSteps,
  saveMemberNotificationPrefs,
  saveMemberSteps,
  sendMemberMessage,
  type MemberActionState,
} from './config-actions';

const ZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
  'UTC',
];

/** The two settings a member can get stuck on: the goal and the zone. */
export function MemberStepsForm({ userId, config }: { userId: string; config: MemberConfig }) {
  const [state, action, pending] = useActionState<MemberActionState, FormData>(saveMemberSteps, {});
  const { goal } = config.steps;
  const zones = ZONES.includes(config.account.timezone) ? ZONES : [config.account.timezone, ...ZONES];

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

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="dailyStepGoal"
            label="Daily step goal"
            type="number"
            size="small"
            fullWidth
            defaultValue={goal.current}
            disabled={pending}
            helperText={`${goal.min.toLocaleString('en-IN')}–${goal.max.toLocaleString('en-IN')}, in steps of ${goal.increment}${
              goal.recommended ? ` · suggested ${goal.recommended.toLocaleString('en-IN')}` : ''
            }`}
            slotProps={{ htmlInput: { min: goal.min, max: goal.max, step: goal.increment } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            name="timezone"
            label="Days are counted in"
            size="small"
            fullWidth
            defaultValue={config.account.timezone}
            disabled={pending}
            helperText={`Their day today is ${config.account.localDay}. Days already scored keep the zone they were scored in.`}
          >
            {zones.map(zone => (
              <MenuItem key={zone} value={zone}>
                {zone}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={12}>
          <TextField name="note" label="Why (kept in the audit log)" size="small" fullWidth disabled={pending} />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          Save
        </Button>
      </Box>
    </Stack>
  );
}

/** Silencing a category, and the quiet window. Off only — see the action. */
export function MemberNotificationPrefsForm({ userId, config }: { userId: string; config: MemberConfig }) {
  const [state, action, pending] = useActionState<MemberActionState, FormData>(saveMemberNotificationPrefs, {});
  const { preferences } = config.notifications;

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

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          What they have agreed to be told about
        </Typography>
        <Grid container spacing={1}>
          {Object.entries(preferences.categories).map(([category, on]) => (
            <Grid key={category} size={{ xs: 12, sm: 6, md: 4 }}>
              {on ? (
                <FormControlLabel
                  control={<Switch name="silence" value={category} defaultChecked disabled={pending} />}
                  label={<Typography variant="body2">{category}</Typography>}
                  // A switch that is on submits nothing; turning it off submits
                  // the category's name, which is the only verb this form has.
                  sx={{ '& .MuiSwitch-root': { mr: 0.5 } }}
                />
              ) : (
                <Tooltip title="Only the member can turn this back on, in the app">
                  <FormControlLabel
                    control={<Switch checked={false} disabled />}
                    label={
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                          {category}
                        </Typography>
                        <Label color="default" variant="soft">
                          off
                        </Label>
                      </Stack>
                    }
                  />
                </Tooltip>
              )}
            </Grid>
          ))}
        </Grid>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          A switch can be turned off here and not back on: silencing somebody who asked to be silenced is support, and
          consent is theirs to give.
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Quiet hours{' '}
          <Box component="span" sx={{ color: 'text.disabled', fontWeight: 400 }}>
            · in {config.account.timezone}
            {config.notifications.quiet.now ? ` · quiet right now, for another ${config.notifications.quiet.endsInMinutes} min` : ''}
          </Box>
        </Typography>
        {/* See `money-forms.tsx`: an unchecked switch submits nothing. */}
        <input type="hidden" name="quietEnabled" value="off" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControlLabel
              control={<Switch name="quietEnabled" defaultChecked={preferences.quietHours.enabled} disabled={pending} />}
              label={<Typography variant="body2">Hold pushes overnight</Typography>}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              name="quietStart"
              label="From"
              type="time"
              size="small"
              fullWidth
              defaultValue={preferences.quietHours.start}
              disabled={pending}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              name="quietEnd"
              label="Until"
              type="time"
              size="small"
              fullWidth
              defaultValue={preferences.quietHours.end}
              disabled={pending}
            />
          </Grid>
        </Grid>
      </Box>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:bell-off-bold-duotone" />}>
          Save preferences
        </Button>
      </Box>
    </Stack>
  );
}

const TOPICS = ['steps', 'workout', 'streak', 'hydration', 'coins', 'challenge', 'reward', 'health', 'system'] as const;

/** Tells them something. The feed row always; the push, if they allow it. */
export function SendMessageForm({ userId, config }: { userId: string; config: MemberConfig }) {
  const [state, action, pending] = useActionState<MemberActionState, FormData>(sendMemberMessage, {});
  const { reachable, quiet } = config.notifications;

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
        <Grid size={{ xs: 12, sm: 8 }}>
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
            minRows={2}
            disabled={pending}
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
        </Grid>
        <Grid size={12}>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <FormControlLabel
              control={<Switch name="exemptFromQuietHours" disabled={pending} />}
              label={<Typography variant="body2">Send even inside quiet hours</Typography>}
            />
            <FormControlLabel
              control={<Switch name="suppressPush" disabled={pending} />}
              label={<Typography variant="body2">Feed row only, no push</Typography>}
            />
          </Stack>
        </Grid>
        <Grid size={12}>
          <TextField name="note" label="Why (kept in the audit log)" size="small" fullWidth disabled={pending} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:plain-bold-duotone" />}>
          Send
        </Button>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {reachable.canShow > 0
            ? `${reachable.canShow} of their ${reachable.installs} phone(s) can show it`
            : 'No phone of theirs can show a push — the feed row is all they will get'}
          {quiet.now ? ` · they are in quiet hours for another ${quiet.endsInMinutes} min` : ''}
          {reachable.pushConfigured ? '' : ' · no push provider is configured on the API'}
        </Typography>
      </Stack>
    </Stack>
  );
}

/** The silent "sync now" push — the answer to "my steps are stuck". */
export function NudgeForm({ userId, dueCount }: { userId: string; dueCount: number }) {
  const [state, action, pending] = useActionState<MemberActionState, FormData>(nudgeMemberSteps, {});

  return (
    <Stack component="form" action={action} spacing={1.5}>
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
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Button
          type="submit"
          variant="outlined"
          loading={pending}
          startIcon={<Iconify icon="solar:refresh-circle-bold-duotone" />}
        >
          Ask their phones to sync now
        </Button>
        <FormControlLabel
          control={<Switch name="remind" disabled={pending} />}
          label={<Typography variant="body2">…and tell them in words</Typography>}
        />
        {dueCount > 0 && (
          <Label color="warning" variant="soft">
            {dueCount} install(s) the job would chase anyway
          </Label>
        )}
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        A silent data push: nothing rings, the app syncs in the background. It skips the job’s cooldown, because an
        operator pressing it has a member on the phone.
      </Typography>
    </Stack>
  );
}
