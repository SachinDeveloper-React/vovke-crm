'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { DialogButton, DialogIconButton } from '@/src/components/ui/dialog-button';
import { slugify } from '@/src/lib/slug';
import type { AdminAchievement } from '@/src/lib/types';

import { deleteAchievement, saveAchievement, type GamificationActionState } from './actions';
import { Said } from './challenge-forms';

/** What each rule watches, so the threshold box says what it is a threshold of. */
const RULES: Record<string, string> = {
  best_day_steps: 'their best day’s verified steps',
  best_day_calories: 'their best day’s calories',
  best_day_minutes: 'their best day’s active minutes',
  longest_streak: 'their longest streak, in days',
  total_workouts: 'workouts finished, all time',
  challenges_completed: 'challenges finished, all time',
};

/**
 * A badge, new or changed.
 *
 * Two fields decide whether anybody can ever get it, and they are
 * independent: a **rule** unlocks it on its own figures, and a challenge
 * with `rewardsBadge` unlocks it on a completion. A badge with neither is
 * one nothing can reach — the list marks those, and this form says so
 * while it is being written rather than afterwards.
 */
export function AchievementForm({
  achievement,
  metrics,
  rules,
}: {
  achievement?: AdminAchievement;
  metrics: string[];
  rules: string[];
}) {
  const [state, action, pending] = useActionState<GamificationActionState, FormData>(saveAchievement, {});
  const [label, setLabel] = useState(achievement?.label ?? '');
  const [slug, setSlug] = useState(achievement?.id ?? '');
  const [slugTyped, setSlugTyped] = useState(Boolean(achievement));
  const [rule, setRule] = useState(achievement?.rule ?? '');

  const derived = slugTyped ? slug : label ? `a-${slugify(label)}` : '';

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />
      {achievement && <input type="hidden" name="id" value={achievement.id} />}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            name="label"
            label="Badge"
            size="small"
            fullWidth
            required
            value={label}
            onChange={event => setLabel(event.target.value)}
            disabled={pending}
            helperText="On the tile — “10K Steps”"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            name="title"
            label="Title"
            size="small"
            fullWidth
            defaultValue={achievement?.title ?? ''}
            disabled={pending}
            helperText="On its own screen; the badge name when empty"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            {...(achievement ? {} : { name: 'slug' })}
            label="Id"
            size="small"
            fullWidth
            value={derived}
            onChange={event => {
              setSlugTyped(true);
              setSlug(event.target.value);
            }}
            disabled={pending || Boolean(achievement)}
            helperText={achievement ? 'Fixed: a member holds it by this' : 'Written from the badge name'}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="value"
            label="Stands for"
            type="number"
            size="small"
            fullWidth
            required
            defaultValue={achievement?.value ?? ''}
            disabled={pending}
            helperText="The figure on the badge"
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            select
            name="metric"
            label="Of"
            size="small"
            fullWidth
            defaultValue={achievement?.metric ?? metrics[0] ?? 'steps'}
            disabled={pending}
          >
            {metrics.map(entry => (
              <MenuItem key={entry} value={entry}>
                {entry}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            name="rule"
            label="Unlocked by"
            size="small"
            fullWidth
            value={rule}
            onChange={event => setRule(event.target.value)}
            disabled={pending}
            helperText={rule ? RULES[rule] : 'Nothing on its own — only a challenge that awards it'}
          >
            <MenuItem value="">— a challenge only —</MenuItem>
            {rules.map(entry => (
              <MenuItem key={entry} value={entry}>
                {entry.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            name="threshold"
            label="At"
            type="number"
            size="small"
            fullWidth
            defaultValue={achievement?.threshold ?? ''}
            disabled={pending || rule === ''}
            helperText={rule ? 'Empty: the figure above' : 'Only with a rule'}
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            name="rewardCoins"
            label="Pays"
            type="number"
            size="small"
            fullWidth
            defaultValue={achievement?.rewardCoins ?? 0}
            disabled={pending}
            helperText="Coins, held until the switch is on"
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            name="sort"
            label="Order"
            type="number"
            size="small"
            fullWidth
            defaultValue={achievement?.sort ?? 0}
            disabled={pending}
            helperText="Smallest first on the shelf"
          />
        </Grid>

        <Grid size={12}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          {achievement ? 'Save the badge' : 'Add the badge'}
        </Button>
      </Box>
    </Stack>
  );
}

/** Deleting a badge: refused while anybody holds it, or a challenge awards it. */
export function AchievementDelete({ achievement }: { achievement: AdminAchievement }) {
  const [state, action, pending] = useActionState<GamificationActionState, FormData>(deleteAchievement, {});
  const held = achievement.members > 0 || achievement.awardedBy.length > 0;

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />
      <input type="hidden" name="id" value={achievement.id} />

      {achievement.members > 0 && (
        <Alert severity="info" variant="outlined">
          {achievement.members} member(s) hold {achievement.label}, and a badge is never taken back. Change what it
          says instead — the figure, the title, what it pays.
        </Alert>
      )}
      {achievement.awardedBy.length > 0 && (
        <Alert severity="info" variant="outlined">
          {achievement.awardedBy.map(entry => entry.title).join(', ')} award
          {achievement.awardedBy.length === 1 ? 's' : ''} this badge. Point {achievement.awardedBy.length === 1 ? 'it' : 'them'}{' '}
          elsewhere first.
        </Alert>
      )}
      {!held && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Nobody holds {achievement.label} and no challenge awards it, so it can go.
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="confirm"
            label={`Type ${achievement.id}`}
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

export function AddAchievementButton({ metrics, rules }: { metrics: string[]; rules: string[] }) {
  return (
    <DialogButton
      label="Add a badge"
      icon="mingcute:add-line"
      variant="contained"
      color="primary"
      maxWidth="md"
      title="A new badge"
      subtitle="Give it a rule, or point a challenge at it — a badge with neither is one nothing can unlock."
    >
      <AchievementForm metrics={metrics} rules={rules} />
    </DialogButton>
  );
}

export function AchievementRowActions({
  achievement,
  metrics,
  rules,
}: {
  achievement: AdminAchievement;
  metrics: string[];
  rules: string[];
}) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
      <DialogIconButton
        icon="solar:pen-bold-duotone"
        tooltip={`Edit ${achievement.label}`}
        maxWidth="md"
        title={achievement.label}
        subtitle={`${achievement.id} — ${achievement.members} member(s) hold it.`}
      >
        <AchievementForm achievement={achievement} metrics={metrics} rules={rules} />
      </DialogIconButton>
      <DialogIconButton
        icon="solar:trash-bin-trash-bold-duotone"
        tooltip={`Delete ${achievement.label}`}
        color="error"
        title={`Delete ${achievement.label}`}
        subtitle="A badge somebody holds is never taken back."
      >
        <AchievementDelete achievement={achievement} />
      </DialogIconButton>
    </Stack>
  );
}
