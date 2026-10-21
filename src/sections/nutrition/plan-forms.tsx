'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { DialogButton, DialogIconButton } from '@/src/components/ui/dialog-button';
import type { AdminPlan } from '@/src/lib/types';

import { deletePlan, retirePlan, savePlan, type PlanActionState } from './plan-actions';
import { daysAsText, PLAN_TEMPLATE } from './plan-text';

const DIET_TYPES = ['vegetarian', 'vegan', 'eggetarian', 'non_vegetarian'] as const;
const MEAL_PLANS = ['balanced', 'high_protein', 'low_carb', 'keto'] as const;

function Said({ state }: { state: PlanActionState }) {
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

/** A row of tick boxes that all submit under one name, so the action reads them as a list. */
function Ticks({
  name,
  label,
  options,
  selected,
  disabled,
}: {
  name: string;
  label: string;
  options: readonly string[];
  selected: string[];
  disabled?: boolean;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
        {options.map(option => (
          <FormControlLabel
            key={option}
            control={<Checkbox name={name} value={option} defaultChecked={selected.includes(option)} disabled={disabled} size="small" />}
            label={<Typography variant="body2">{option.replace(/_/g, ' ')}</Typography>}
          />
        ))}
      </Stack>
    </Stack>
  );
}

/**
 * A diet plan, new or changed.
 *
 * The programme is one text box, and that is a decision rather than a
 * shortcut: a plan is up to 31 days of up to 8 meals of up to 20 items, so
 * a repeating field editor for it would be several hundred inputs nobody
 * can see at once. Written out, a day is a heading and its meals are one
 * line each — which is also the shape it pastes in and out of a
 * nutritionist's spreadsheet as.
 *
 * The whole programme replaces the old one on save, because a plan is only
 * ever read whole and only ever edited whole.
 */
export function PlanForm({ plan }: { plan?: AdminPlan }) {
  const [state, action, pending] = useActionState<PlanActionState, FormData>(savePlan, {});

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />

      <input type="hidden" name="active" value="off" />
      {plan && <input type="hidden" name="id" value={plan.id} />}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="name"
            label="Name"
            size="small"
            fullWidth
            required
            defaultValue={plan?.name ?? ''}
            disabled={pending}
            helperText="What a member picks it by"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField name="emoji" label="Emoji" size="small" fullWidth defaultValue={plan?.emoji ?? '🥗'} disabled={pending} />
        </Grid>
        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField
            name="sort"
            label="Order"
            type="number"
            size="small"
            fullWidth
            defaultValue={plan?.sort ?? 0}
            disabled={pending}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <FormControlLabel
            control={<Switch name="active" defaultChecked={plan?.active ?? true} disabled={pending} />}
            label={<Typography variant="body2">On offer</Typography>}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            name="description"
            label="Description"
            size="small"
            fullWidth
            defaultValue={plan?.description ?? ''}
            disabled={pending}
            helperText="One line on the card"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Ticks name="dietTypes" label="Suits these diets" options={DIET_TYPES} selected={plan?.dietTypes ?? ['vegetarian']} disabled={pending} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Ticks name="mealPlans" label="Suits these meal plans" options={MEAL_PLANS} selected={plan?.mealPlans ?? ['balanced']} disabled={pending} />
        </Grid>

        <Grid size={12}>
          <TextField
            name="days"
            label="The programme"
            size="small"
            fullWidth
            multiline
            minRows={10}
            required
            defaultValue={plan ? daysAsText(plan.days) : PLAN_TEMPLATE}
            disabled={pending}
            helperText="A # line starts a day and names it. Every other line is a meal: slot | HH:mm | calories | protein | carbs | fats | item = amount; item = amount"
            slotProps={{ htmlInput: { style: { fontFamily: 'var(--font-mono, monospace)', fontSize: 13 } } }}
          />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          {plan ? 'Save the plan' : 'Add the plan'}
        </Button>
      </Box>
    </Stack>
  );
}

/** Out of the library and back. Retiring hands everybody on it to the server's choice. */
export function PlanRetireButton({ plan }: { plan: AdminPlan }) {
  const [state, action, pending] = useActionState<PlanActionState, FormData>(retirePlan, {});

  return (
    <Stack component="form" action={action} spacing={0.5}>
      <input type="hidden" name="id" value={plan.id} />
      <input type="hidden" name="active" value={plan.active ? 'false' : 'true'} />
      <Button type="submit" size="small" color={plan.active ? 'error' : 'primary'} loading={pending} sx={{ minWidth: 78 }}>
        {plan.active ? 'Retire' : 'Restore'}
      </Button>
      {state.error && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {state.error}
        </Typography>
      )}
    </Stack>
  );
}

/** Deleting a plan: the draft nobody followed. */
export function PlanDelete({ plan, members }: { plan: AdminPlan; members: number }) {
  const [state, action, pending] = useActionState<PlanActionState, FormData>(deletePlan, {});

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />
      <input type="hidden" name="id" value={plan.id} />
      <input type="hidden" name="name" value={plan.name} />

      {members > 0 ? (
        <Alert severity="info" variant="outlined">
          {members} member(s) chose {plan.name}. Deleting it hands them back to the server’s own choice — retiring it
          does the same thing and keeps the row their history points at.
        </Alert>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Nobody is on {plan.name}, so it can go.
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="confirm"
            label={`Type ${plan.name}`}
            size="small"
            fullWidth
            disabled={pending}
            helperText="This cannot be undone"
          />
        </Grid>
      </Grid>

      <Box>
        <Button
          type="submit"
          color="error"
          variant="outlined"
          loading={pending}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
        >
          Delete it
        </Button>
      </Box>
    </Stack>
  );
}

export function AddPlanButton() {
  return (
    <DialogButton
      label="Add a plan"
      icon="mingcute:add-line"
      variant="contained"
      color="primary"
      maxWidth="md"
      title="A new diet plan"
      subtitle="A programme of days that runs in rotation. It opens with an example — type over it."
    >
      <PlanForm />
    </DialogButton>
  );
}

export function PlanRowActions({ plan, members }: { plan: AdminPlan; members: number }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      <PlanRetireButton plan={plan} />
      <DialogIconButton
        icon="solar:pen-bold-duotone"
        tooltip={`Edit ${plan.name}`}
        maxWidth="md"
        title={plan.name}
        subtitle={`${plan.days.length} day(s) · ${members} member(s) on it. Saving replaces the whole programme.`}
      >
        <PlanForm plan={plan} />
      </DialogIconButton>
      <DialogIconButton
        icon="solar:trash-bin-trash-bold-duotone"
        tooltip={`Delete ${plan.name}`}
        color="error"
        title={`Delete ${plan.name}`}
        subtitle="Retiring it keeps the row a member’s history points at."
      >
        <PlanDelete plan={plan} members={members} />
      </DialogIconButton>
    </Stack>
  );
}
