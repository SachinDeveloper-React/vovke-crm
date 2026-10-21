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
// Straight from the module rather than the `components/ui` barrel: the
// barrel also exports `ApiErrorNotice`, which imports `lib/api` and so
// `server-only` — and pulling that into a client component fails the build.
import { DialogButton, DialogIconButton } from '@/src/components/ui/dialog-button';
import { slugify } from '@/src/lib/slug';
import type { AdminAchievement, AdminChallenge } from '@/src/lib/types';

import { deleteChallenge, saveChallenge, setChallengeActive, type GamificationActionState } from './actions';

/** The answer an action came back with, in the same place in every form. */
export function Said({ state }: { state: GamificationActionState }) {
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

/** What each metric counts, said once so a goal box is never a mystery. */
const UNITS: Record<string, string> = {
  steps: 'verified steps',
  calories: 'calories burned',
  minutes: 'active minutes',
  days: 'days hitting the goal',
  workouts: 'workouts finished',
};

const CADENCE_NOTE: Record<string, string> = {
  daily: 'resets every day',
  weekly: 'resets on the week',
  monthly: 'resets on the month',
};

/**
 * A challenge, new or changed.
 *
 * The id is the field that behaves differently between the two: every
 * completion row keys on it, so it is written from the title once and then
 * fixed. The goal and the cadence stay editable afterwards — a completion
 * keeps the goal it was judged against, so raising the bar changes what
 * today takes and leaves yesterday's payout alone.
 */
export function ChallengeForm({
  challenge,
  badges,
  metrics,
  cadences,
}: {
  challenge?: AdminChallenge;
  badges: AdminAchievement[];
  metrics: string[];
  cadences: string[];
}) {
  const [state, action, pending] = useActionState<GamificationActionState, FormData>(saveChallenge, {});
  const [title, setTitle] = useState(challenge?.title ?? '');
  const [slug, setSlug] = useState(challenge?.id ?? '');
  const [slugTyped, setSlugTyped] = useState(Boolean(challenge));
  const [metric, setMetric] = useState(challenge?.metric ?? metrics[0] ?? 'steps');
  const [rewardsBadge, setRewardsBadge] = useState(challenge?.rewardsBadge ?? false);

  const derived = slugTyped ? slug : title ? `ch-${slugify(title)}` : '';

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />

      {/* An unchecked switch submits nothing: the hidden `off` is what lets one be turned off. */}
      <input type="hidden" name="rewardsBadge" value="off" />
      <input type="hidden" name="active" value="off" />
      {challenge && <input type="hidden" name="id" value={challenge.id} />}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            name="title"
            label="Title"
            size="small"
            fullWidth
            required
            value={title}
            onChange={event => setTitle(event.target.value)}
            disabled={pending}
            helperText="What a member reads on the card"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            {...(challenge ? {} : { name: 'slug' })}
            label="Id"
            size="small"
            fullWidth
            value={derived}
            onChange={event => {
              setSlugTyped(true);
              setSlug(event.target.value);
            }}
            disabled={pending || Boolean(challenge)}
            helperText={challenge ? 'Fixed: every completion keys on it' : 'Written from the title'}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            name="description"
            label="Description"
            size="small"
            fullWidth
            defaultValue={challenge?.description ?? ''}
            disabled={pending}
            helperText="One line — “Walk 10,000 steps in a day”"
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            select
            name="metric"
            label="Counts"
            size="small"
            fullWidth
            value={metric}
            onChange={event => setMetric(event.target.value)}
            disabled={pending}
          >
            {metrics.map(entry => (
              <MenuItem key={entry} value={entry}>
                {entry}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            select
            name="cadence"
            label="Resets"
            size="small"
            fullWidth
            defaultValue={challenge?.cadence ?? cadences[0] ?? 'daily'}
            disabled={pending}
            helperText={CADENCE_NOTE[challenge?.cadence ?? 'daily']}
          >
            {cadences.map(entry => (
              <MenuItem key={entry} value={entry}>
                {entry}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="goal"
            label="Goal"
            type="number"
            size="small"
            fullWidth
            required
            defaultValue={challenge?.goal ?? ''}
            disabled={pending}
            helperText={UNITS[metric] ?? metric}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="rewardCoins"
            label="Pays"
            type="number"
            size="small"
            fullWidth
            defaultValue={challenge?.rewardCoins ?? 0}
            disabled={pending}
            helperText="Coins, once per period"
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControlLabel
            control={
              <Switch
                name="rewardsBadge"
                checked={rewardsBadge}
                onChange={event => setRewardsBadge(event.target.checked)}
                disabled={pending}
              />
            }
            label={<Typography variant="body2">Awards a badge</Typography>}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            select
            name="badgeId"
            label="The badge"
            size="small"
            fullWidth
            defaultValue={challenge?.badgeId ?? ''}
            disabled={pending || !rewardsBadge}
            helperText={rewardsBadge ? 'Added on Achievements' : 'Only when it awards one'}
          >
            <MenuItem value="">— none —</MenuItem>
            {badges.map(badge => (
              <MenuItem key={badge.id} value={badge.id}>
                {badge.label} ({badge.members} held)
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="startsOn"
            label="Opens"
            type="date"
            size="small"
            fullWidth
            defaultValue={challenge?.startsOn ?? ''}
            disabled={pending}
            helperText="Empty: always"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="endsOn"
            label="Closes"
            type="date"
            size="small"
            fullWidth
            defaultValue={challenge?.endsOn ?? ''}
            disabled={pending}
            helperText="Empty: never"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField
            name="emoji"
            label="Emoji"
            size="small"
            fullWidth
            defaultValue={challenge?.emoji ?? '🏅'}
            disabled={pending}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField
            name="sort"
            label="Order"
            type="number"
            size="small"
            fullWidth
            defaultValue={challenge?.sort ?? 0}
            disabled={pending}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <FormControlLabel
            control={<Switch name="active" defaultChecked={challenge?.active ?? true} disabled={pending} />}
            label={<Typography variant="body2">On the board</Typography>}
          />
        </Grid>

        <Grid size={12}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          {challenge ? 'Save the challenge' : 'Add the challenge'}
        </Button>
      </Box>
    </Stack>
  );
}

/** Deleting one: refused by the API the moment anybody has finished it. */
export function ChallengeDelete({ challenge }: { challenge: AdminChallenge }) {
  const [state, action, pending] = useActionState<GamificationActionState, FormData>(deleteChallenge, {});
  const held = challenge.completions.total > 0;

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />
      <input type="hidden" name="id" value={challenge.id} />

      {held ? (
        <Alert severity="info" variant="outlined">
          {challenge.completions.total} completion(s) by {challenge.completions.members} member(s) point at this
          challenge, and each one paid coins. Retiring it takes it off every board and leaves that history readable.
        </Alert>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Nobody has finished {challenge.title}, so it can go outright.
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="confirm"
            label={`Type ${challenge.id}`}
            size="small"
            fullWidth
            disabled={pending || held}
            helperText="This cannot be undone"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending || held} helperText="Audit row" />
        </Grid>
      </Grid>

      <Box>
        <Button
          type="submit"
          color="error"
          variant="outlined"
          loading={pending}
          disabled={held}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
        >
          Delete it
        </Button>
      </Box>
    </Stack>
  );
}

/** Off the board and back, as a one-button form on the row. */
export function ChallengeActiveButton({ challenge }: { challenge: AdminChallenge }) {
  const [state, action, pending] = useActionState<GamificationActionState, FormData>(setChallengeActive, {});

  return (
    <Stack component="form" action={action} spacing={0.5}>
      <input type="hidden" name="id" value={challenge.id} />
      <input type="hidden" name="active" value={challenge.active ? 'false' : 'true'} />
      <Button
        type="submit"
        size="small"
        color={challenge.active ? 'error' : 'primary'}
        loading={pending}
        sx={{ minWidth: 78 }}
      >
        {challenge.active ? 'Retire' : 'Restore'}
      </Button>
      {state.error && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {state.error}
        </Typography>
      )}
    </Stack>
  );
}

export function AddChallengeButton({
  badges,
  metrics,
  cadences,
}: {
  badges: AdminAchievement[];
  metrics: string[];
  cadences: string[];
}) {
  return (
    <DialogButton
      label="Add a challenge"
      icon="mingcute:add-line"
      variant="contained"
      color="primary"
      maxWidth="md"
      title="A new challenge"
      subtitle="Every member is enrolled in every open challenge, so this is live on the next fetch."
    >
      <ChallengeForm badges={badges} metrics={metrics} cadences={cadences} />
    </DialogButton>
  );
}

export function ChallengeRowActions({
  challenge,
  badges,
  metrics,
  cadences,
}: {
  challenge: AdminChallenge;
  badges: AdminAchievement[];
  metrics: string[];
  cadences: string[];
}) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      <ChallengeActiveButton challenge={challenge} />
      <DialogIconButton
        icon="solar:pen-bold-duotone"
        tooltip={`Edit ${challenge.title}`}
        maxWidth="md"
        title={challenge.title}
        subtitle={`${challenge.id} — the id is fixed, because every completion keys on it.`}
      >
        <ChallengeForm challenge={challenge} badges={badges} metrics={metrics} cadences={cadences} />
      </DialogIconButton>
      <DialogIconButton
        icon="solar:trash-bin-trash-bold-duotone"
        tooltip={`Delete ${challenge.title}`}
        color="error"
        title={`Delete ${challenge.title}`}
        subtitle="Retiring it instead keeps every completion readable."
      >
        <ChallengeDelete challenge={challenge} />
      </DialogIconButton>
    </Stack>
  );
}
