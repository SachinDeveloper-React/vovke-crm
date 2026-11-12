'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { Iconify } from '@/src/components/iconify/iconify';
// Straight from the module: the `components/ui` barrel pulls in `lib/api`,
// which is server-only, and a client component importing it fails the build.
import { DialogButton } from '@/src/components/ui/dialog-button';
import type { UserOverview } from '@/src/lib/types';

import { saveMemberProfile, type ProfileActionState } from './profile-actions';

type Account = UserOverview['account'];

/** The same lists the app's own profile screen offers (contracts `fitnessGoalSchema` and friends). */
const GOALS = [
  { value: 'stay_active', label: 'Stay active' },
  { value: 'lose_weight', label: 'Lose weight' },
  { value: 'build_muscle', label: 'Build muscle' },
  { value: 'gain_strength', label: 'Gain strength' },
  { value: 'improve_endurance', label: 'Improve endurance' },
];
const LEVELS = ['sedentary', 'light', 'moderate', 'active', 'athlete'];
const GENDERS = [
  { value: '', label: '— not given —' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
];

function ProfileForm({ account }: { account: Account }) {
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(saveMemberProfile, {});

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <input type="hidden" name="userId" value={account.id} />
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
          <TextField name="name" label="Name" size="small" fullWidth required defaultValue={account.name} disabled={pending} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="avatarUrl"
            label="Photo URL"
            size="small"
            fullWidth
            defaultValue={account.avatarUrl ?? ''}
            disabled={pending}
            helperText="Empty: no photo"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="email"
            label="Email"
            type="email"
            size="small"
            fullWidth
            required
            defaultValue={account.email}
            disabled={pending}
            helperText="A new address is unverified until proven"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="phone"
            label="Phone"
            size="small"
            fullWidth
            defaultValue={account.phone ?? ''}
            disabled={pending}
            placeholder="+919876543210"
            helperText="With the country code. A new number is unverified until proven"
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="heightCm"
            label="Height (cm)"
            type="number"
            size="small"
            fullWidth
            defaultValue={account.heightCm ?? ''}
            disabled={pending}
            slotProps={{ htmlInput: { min: 90, max: 250, step: 0.1 } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="weightKg"
            label="Weight (kg)"
            type="number"
            size="small"
            fullWidth
            defaultValue={account.weightKg ?? ''}
            disabled={pending}
            helperText="Also logged as a reading"
            slotProps={{ htmlInput: { min: 25, max: 300, step: 0.1 } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="dateOfBirth"
            label="Date of birth"
            type="date"
            size="small"
            fullWidth
            defaultValue={account.dateOfBirth ?? ''}
            disabled={pending}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField select name="gender" label="Gender" size="small" fullWidth defaultValue={account.gender ?? ''} disabled={pending}>
            {GENDERS.map(gender => (
              <MenuItem key={gender.value} value={gender.value}>
                {gender.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select name="goal" label="Goal" size="small" fullWidth defaultValue={account.goal ?? 'stay_active'} disabled={pending}>
            {GOALS.map(goal => (
              <MenuItem key={goal.value} value={goal.value}>
                {goal.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            select
            name="activityLevel"
            label="Activity level"
            size="small"
            fullWidth
            defaultValue={account.activityLevel ?? 'moderate'}
            disabled={pending}
          >
            {LEVELS.map(level => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            name="weeklyGoalWorkouts"
            label="Workouts a week"
            type="number"
            size="small"
            fullWidth
            defaultValue={account.weeklyGoalWorkouts ?? 4}
            disabled={pending}
            slotProps={{ htmlInput: { min: 1, max: 14, step: 1 } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField select name="units" label="Units" size="small" fullWidth defaultValue={account.units ?? 'metric'} disabled={pending}>
            <MenuItem value="metric">metric (kg, cm)</MenuItem>
            <MenuItem value="imperial">imperial (lb, ft)</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            name="country"
            label="Country"
            size="small"
            fullWidth
            defaultValue={account.country ?? 'IN'}
            disabled={pending}
            helperText="Two letters, like IN"
            slotProps={{ htmlInput: { maxLength: 2 } }}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            name="reason"
            label="Why (required, kept on the audit row)"
            size="small"
            fullWidth
            required
            disabled={pending}
            slotProps={{ htmlInput: { maxLength: 300 } }}
          />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          Save the profile
        </Button>
      </Box>
    </Stack>
  );
}

/**
 * "Edit profile", in the member header so it is there on every tab.
 *
 * The step goal, time zone and quiet hours are on the Config tab and the
 * frozen / legal-hold switches on Overview, because each of those has its
 * own rules; this is the profile the member themselves can edit in the app.
 */
export function EditProfileButton({ account }: { account: Account }) {
  if (account.deletedAt) return null;
  return (
    <DialogButton
      label="Edit profile"
      icon="solar:pen-bold-duotone"
      variant="outlined"
      maxWidth="md"
      title={`Edit ${account.name || 'this member'}`}
      subtitle="Only the fields that differ are written, and each change is on the audit row with your reason."
    >
      <ProfileForm account={account} />
    </DialogButton>
  );
}
