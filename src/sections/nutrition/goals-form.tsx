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
import type { NutritionOverview } from '@/src/lib/types';

import { setNutritionDefaults, type PlanActionState } from './plan-actions';

const DIET_TYPES = ['vegetarian', 'vegan', 'eggetarian', 'non_vegetarian'];
const MEAL_PLANS = ['balanced', 'high_protein', 'low_carb', 'keto'];
const GOALS = ['lose_weight', 'maintain', 'gain_weight', 'build_muscle'];

/** 4 kcal a gram of protein and carbs, 9 a gram of fat — the arithmetic the macros have to meet. */
const caloriesOf = (protein: number, carbs: number, fats: number) => protein * 4 + carbs * 4 + fats * 9;

/**
 * The targets a member starts with (RULES N4), as ⚙ `nutrition.*`.
 *
 * These are not every member's goals — anybody who has set their own keeps
 * them — they are what a new member is given and what the app shows until
 * they change it. The sum under the macro boxes is the check worth having
 * in front of you: a 2,200 kcal target whose macros add up to 1,700 is a
 * plan that cannot be followed, and nothing else in the system notices.
 */
export function NutritionGoalsForm({ defaults }: { defaults: NutritionOverview['defaults'] }) {
  const [state, action, pending] = useActionState<PlanActionState, FormData>(setNutritionDefaults, {});
  const [calories, setCalories] = useState(String(defaults.defaultGoals.calories));
  const [protein, setProtein] = useState(String(defaults.defaultGoals.proteinG));
  const [carbs, setCarbs] = useState(String(defaults.defaultGoals.carbsG));
  const [fats, setFats] = useState(String(defaults.defaultGoals.fatsG));

  const fromMacros = caloriesOf(Number(protein) || 0, Number(carbs) || 0, Number(fats) || 0);
  const target = Number(calories) || 0;
  const drift = fromMacros - target;
  const off = Math.abs(drift) > Math.max(50, target * 0.05);

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
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="calories"
            label="Calories"
            type="number"
            size="small"
            fullWidth
            value={calories}
            onChange={event => setCalories(event.target.value)}
            disabled={pending}
            helperText="kcal a day"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="proteinG"
            label="Protein"
            type="number"
            size="small"
            fullWidth
            value={protein}
            onChange={event => setProtein(event.target.value)}
            disabled={pending}
            helperText="grams"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="carbsG"
            label="Carbs"
            type="number"
            size="small"
            fullWidth
            value={carbs}
            onChange={event => setCarbs(event.target.value)}
            disabled={pending}
            helperText="grams"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="fatsG"
            label="Fats"
            type="number"
            size="small"
            fullWidth
            value={fats}
            onChange={event => setFats(event.target.value)}
            disabled={pending}
            helperText="grams"
          />
        </Grid>

        <Grid size={12}>
          <Typography variant="caption" sx={{ color: off ? 'warning.main' : 'text.disabled' }}>
            Those macros come to {fromMacros.toLocaleString('en-IN')} kcal (4 a gram of protein and carbs, 9 of fat)
            {off
              ? ` — ${Math.abs(drift).toLocaleString('en-IN')} ${drift > 0 ? 'above' : 'below'} the calorie target. A member following the macros would miss the target.`
              : ' — in step with the calorie target.'}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            name="dietType"
            label="Diet"
            size="small"
            fullWidth
            defaultValue={defaults.defaultPreferences.dietType}
            disabled={pending}
          >
            {DIET_TYPES.map(option => (
              <MenuItem key={option} value={option}>
                {option.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            name="mealPlan"
            label="Meal plan"
            size="small"
            fullWidth
            defaultValue={defaults.defaultPreferences.mealPlan}
            disabled={pending}
          >
            {MEAL_PLANS.map(option => (
              <MenuItem key={option} value={option}>
                {option.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            name="goal"
            label="Goal"
            size="small"
            fullWidth
            defaultValue={defaults.defaultPreferences.goal}
            disabled={pending}
          >
            {GOALS.map(option => (
              <MenuItem key={option} value={option}>
                {option.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="maxEntriesPerSave"
            label="Foods per save"
            type="number"
            size="small"
            fullWidth
            defaultValue={defaults.maxEntriesPerSave}
            disabled={pending}
            helperText="One tap of Save"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="maxAgeDays"
            label="Log back to"
            type="number"
            size="small"
            fullWidth
            defaultValue={defaults.maxAgeDays}
            disabled={pending}
            helperText="Days"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="searchLimit"
            label="Search results"
            type="number"
            size="small"
            fullWidth
            defaultValue={defaults.searchLimit}
            disabled={pending}
            helperText="At most"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="libraryPageSize"
            label="Library page"
            type="number"
            size="small"
            fullWidth
            defaultValue={defaults.libraryPageSize}
            disabled={pending}
            helperText="Rows a page"
          />
        </Grid>

        <Grid size={12}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          Save the defaults
        </Button>
      </Box>
    </Stack>
  );
}
