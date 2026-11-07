'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { DialogButton, DialogIconButton } from '@/src/components/ui/dialog-button';
import type { AdminFood } from '@/src/lib/types';

import { deleteFood, retireFood, saveFood, type FoodActionState } from './food-actions';

export function Said({ state }: { state: FoodActionState }) {
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

/**
 * One food in the global library, new or changed.
 *
 * Correcting a figure here never rewrites what anybody already ate: a
 * logged meal keeps its own copy of the macros, which is the whole reason
 * an operator can fix a wrong calorie count without a migration.
 */
/** The four diets, in the order the app's own labels run. */
const DIETS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'non_vegetarian', label: 'Non-vegetarian' },
];

export function FoodForm({ food }: { food?: AdminFood }) {
  const [state, action, pending] = useActionState<FoodActionState, FormData>(saveFood, {});

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />

      <input type="hidden" name="quickAdd" value="off" />
      <input type="hidden" name="active" value="off" />
      {food && <input type="hidden" name="id" value={food.id} />}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            name="name"
            label="Name"
            size="small"
            fullWidth
            required
            defaultValue={food?.name ?? ''}
            disabled={pending}
            helperText="What a search matches"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            name="portion"
            label="Portion"
            size="small"
            fullWidth
            defaultValue={food?.portion ?? ''}
            disabled={pending}
            helperText="“1 Cup (150 g)” — the figures below are for this much"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <TextField name="emoji" label="Emoji" size="small" fullWidth defaultValue={food?.emoji ?? '🍽️'} disabled={pending} />
        </Grid>

        <Grid size={12}>
          <TextField
            name="imageUrl"
            label="Photo URL"
            size="small"
            fullWidth
            defaultValue={food?.imageUrl ?? ''}
            disabled={pending}
            helperText="Upload it under Images and paste the URL here. Left empty the emoji stands in, which is a perfectly good label for a boiled egg."
          />
        </Grid>

        <Grid size={12}>
          <FormControl component="fieldset" disabled={pending}>
            <FormLabel component="legend" sx={{ typography: 'caption' }}>
              Suits these diets
            </FormLabel>
            <FormGroup row>
              {DIETS.map(diet => (
                <FormControlLabel
                  key={diet.value}
                  control={
                    <Checkbox
                      name="dietTypes"
                      value={diet.value}
                      size="small"
                      defaultChecked={food?.dietTypes?.includes(diet.value) ?? false}
                    />
                  }
                  label={<Typography variant="body2">{diet.label}</Typography>}
                />
              ))}
            </FormGroup>
            <FormHelperText>
              Tick nothing and it suits everyone — which is what rice, an apple or dal actually are. Tick only
              what some diet would refuse. This is what stops a suggestion putting chicken in front of a
              vegetarian, so an untagged meat dish is the one mistake worth checking for.
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 6, sm: 2.4 }}>
          <TextField
            name="calories"
            label="Calories"
            type="number"
            size="small"
            fullWidth
            required
            defaultValue={food?.calories ?? ''}
            disabled={pending}
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <TextField
            name="proteinG"
            label="Protein g"
            type="number"
            size="small"
            fullWidth
            defaultValue={food?.proteinG ?? 0}
            disabled={pending}
            slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <TextField
            name="carbsG"
            label="Carbs g"
            type="number"
            size="small"
            fullWidth
            defaultValue={food?.carbsG ?? 0}
            disabled={pending}
            slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <TextField
            name="fatsG"
            label="Fats g"
            type="number"
            size="small"
            fullWidth
            defaultValue={food?.fatsG ?? 0}
            disabled={pending}
            slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <TextField
            name="fiberG"
            label="Fibre g"
            type="number"
            size="small"
            fullWidth
            defaultValue={food?.fiberG ?? 0}
            disabled={pending}
            slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            name="sort"
            label="Order"
            type="number"
            size="small"
            fullWidth
            defaultValue={food?.sort ?? 0}
            disabled={pending}
            helperText="Smallest first"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <FormControlLabel
            control={<Switch name="quickAdd" defaultChecked={food?.quickAdd ?? false} disabled={pending} />}
            label={<Typography variant="body2">A quick-add tile</Typography>}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <FormControlLabel
            control={<Switch name="active" defaultChecked={food?.active ?? true} disabled={pending} />}
            label={<Typography variant="body2">In the library</Typography>}
          />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          {food ? 'Save the food' : 'Add the food'}
        </Button>
      </Box>
    </Stack>
  );
}

/** Deleting one outright: safe, because a logged meal carries its own figures. */
export function FoodDelete({ food }: { food: AdminFood }) {
  const [state, action, pending] = useActionState<FoodActionState, FormData>(deleteFood, {});

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />
      <input type="hidden" name="id" value={food.id} />
      <input type="hidden" name="name" value={food.name} />

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Nothing a member logged changes: a meal keeps its own copy of every figure. Retiring it instead takes it out of
        search and the quick-add row and keeps the row the audit trail points at.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="confirm"
            label={`Type ${food.name}`}
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

/** In and out of the library, as a one-button form on the row. */
export function FoodRetireButton({ food }: { food: AdminFood }) {
  const [state, action, pending] = useActionState<FoodActionState, FormData>(retireFood, {});

  return (
    <Stack component="form" action={action} spacing={0.5}>
      <input type="hidden" name="id" value={food.id} />
      <input type="hidden" name="active" value={food.active ? 'false' : 'true'} />
      <Button type="submit" size="small" color={food.active ? 'error' : 'primary'} loading={pending} sx={{ minWidth: 78 }}>
        {food.active ? 'Retire' : 'Restore'}
      </Button>
      {state.error && (
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {state.error}
        </Typography>
      )}
    </Stack>
  );
}

export function AddFoodButton() {
  return (
    <DialogButton
      label="Add a food"
      icon="mingcute:add-line"
      variant="contained"
      color="primary"
      maxWidth="md"
      title="A new food"
      subtitle="It is searchable the moment it is saved; a quick-add tile also appears on the add-meal screen."
    >
      <FoodForm />
    </DialogButton>
  );
}

export function FoodRowActions({ food }: { food: AdminFood }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      <FoodRetireButton food={food} />
      <DialogIconButton
        icon="solar:pen-bold-duotone"
        tooltip={`Edit ${food.name}`}
        maxWidth="md"
        title={food.name}
        subtitle="Correcting a figure never rewrites what anybody already ate."
      >
        <FoodForm food={food} />
      </DialogIconButton>
      <DialogIconButton
        icon="solar:trash-bin-trash-bold-duotone"
        tooltip={`Delete ${food.name}`}
        color="error"
        title={`Delete ${food.name}`}
        subtitle="For the row imported from the wrong column."
      >
        <FoodDelete food={food} />
      </DialogIconButton>
    </Stack>
  );
}
