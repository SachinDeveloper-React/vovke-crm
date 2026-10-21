'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { saveRelease, setUpdatePolicy, type ReleaseState } from './actions';

/** Tell the app about a build the store is serving. */
export function NewReleaseForm() {
  const [state, action, pending] = useActionState<ReleaseState, FormData>(saveRelease, {});

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
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField select name="platform" label="Platform" defaultValue="android" fullWidth size="small" disabled={pending}>
            <MenuItem value="android">Android</MenuItem>
            <MenuItem value="ios">iOS</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField select name="status" label="Status" defaultValue="current" fullWidth size="small" disabled={pending}>
            <MenuItem value="current">current — the one the store is serving</MenuItem>
            <MenuItem value="supported">supported — still fine</MenuItem>
            <MenuItem value="deprecated">deprecated — makes the app knock</MenuItem>
            <MenuItem value="blocked">blocked — walls off this one build</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField name="version" label="Version" placeholder="1.4.0" fullWidth size="small" required disabled={pending} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField name="build" label="Build" placeholder="41" fullWidth size="small" required disabled={pending} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField name="minOs" label="Minimum OS (optional)" placeholder="14" fullWidth size="small" disabled={pending} />
        </Grid>
        <Grid size={12}>
          <TextField
            name="notes"
            label="What is new, in the member's words"
            placeholder="Shown on the soft prompt"
            fullWidth
            size="small"
            multiline
            minRows={2}
            disabled={pending}
          />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Button type="submit" variant="contained" loading={pending}>
          Record the release
        </Button>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Idempotent on platform, version and build — posting the same release again updates it.
        </Typography>
      </Stack>
    </Stack>
  );
}

/** The wall, and the words on both prompts. */
export function UpdatePolicyForm({
  minIos,
  minAndroid,
  nudgeOnNewer,
}: {
  minIos: string;
  minAndroid: string;
  nudgeOnNewer: boolean;
}) {
  const [state, action, pending] = useActionState<ReleaseState, FormData>(setUpdatePolicy, {});

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
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            name="minIos"
            label="iOS minimum"
            defaultValue={minIos}
            fullWidth
            size="small"
            disabled={pending}
            helperText="Below this, refused"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            name="minAndroid"
            label="Android minimum"
            defaultValue={minAndroid}
            fullWidth
            size="small"
            disabled={pending}
            helperText="Below this, refused"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            name="remindAfterHours"
            label="Soft prompt quiet for"
            placeholder="24"
            fullWidth
            size="small"
            disabled={pending}
            helperText="Hours after it is dismissed"
          />
        </Grid>

        <Grid size={12}>
          <FormControlLabel
            control={<Switch name="nudgeOnNewer" defaultChecked={nudgeOnNewer} disabled={pending} />}
            label="Knock when a newer release is current (off: only a deprecated build knocks)"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            name="hardTitle"
            label="Wall title"
            placeholder="Leave blank to keep the current wording"
            fullWidth
            size="small"
            disabled={pending}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            name="softTitle"
            label="Knock title"
            placeholder="Leave blank to keep"
            fullWidth
            size="small"
            disabled={pending}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            name="hardMessage"
            label="Wall message"
            placeholder="{version}, {latest} and {min} are filled in"
            fullWidth
            size="small"
            multiline
            minRows={2}
            disabled={pending}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            name="softMessage"
            label="Knock message"
            placeholder="{version}, {latest} and {min} are filled in"
            fullWidth
            size="small"
            multiline
            minRows={2}
            disabled={pending}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="actionLabel" label="Action button" placeholder="Update now" fullWidth size="small" disabled={pending} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="laterLabel" label="Dismiss button" placeholder="Later" fullWidth size="small" disabled={pending} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Button type="submit" variant="contained" color="warning" loading={pending}>
          Put this in force
        </Button>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Raising a minimum above what the store is serving is refused — members would have nowhere to go.
        </Typography>
      </Stack>
    </Stack>
  );
}
