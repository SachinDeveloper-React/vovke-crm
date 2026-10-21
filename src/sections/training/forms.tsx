'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { DialogButton, DialogIconButton } from '@/src/components/ui/dialog-button';
import { slugify } from '@/src/lib/slug';
import type { AdminExercise, AdminWorkoutTemplate } from '@/src/lib/types';

import {
  deleteExercise,
  deleteTemplate,
  saveExercise,
  saveTemplate,
  type TrainingActionState,
} from './actions';

function Said({ state }: { state: TrainingActionState }) {
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
 * One exercise.
 *
 * Correcting a name or a muscle group here never rewrites a workout
 * anybody logged: a finished set keeps its own copy of what it was, which
 * is why a typo can be fixed without a migration.
 */
export function ExerciseForm({
  exercise,
  muscleGroups,
  equipment,
}: {
  exercise?: AdminExercise;
  muscleGroups: string[];
  equipment: string[];
}) {
  const [state, action, pending] = useActionState<TrainingActionState, FormData>(saveExercise, {});
  const [name, setName] = useState(exercise?.name ?? '');
  const [slug, setSlug] = useState(exercise?.id ?? '');
  const [slugTyped, setSlugTyped] = useState(Boolean(exercise));

  const derived = slugTyped ? slug : slugify(name);

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />

      <input type="hidden" name="isTimed" value="off" />
      {exercise && <input type="hidden" name="id" value={exercise.id} />}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 7 }}>
          <TextField
            name="name"
            label="Name"
            size="small"
            fullWidth
            required
            value={name}
            onChange={event => setName(event.target.value)}
            disabled={pending}
            helperText="What a member picks in the exercise list"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            {...(exercise ? {} : { name: 'slug' })}
            label="Id"
            size="small"
            fullWidth
            value={derived}
            onChange={event => {
              setSlugTyped(true);
              setSlug(event.target.value);
            }}
            disabled={pending || Boolean(exercise)}
            helperText={exercise ? 'Fixed: templates and logged sets name it' : 'Written from the name'}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            select
            name="muscleGroup"
            label="Works"
            size="small"
            fullWidth
            defaultValue={exercise?.muscleGroup ?? muscleGroups[0] ?? 'full_body'}
            disabled={pending}
          >
            {muscleGroups.map(group => (
              <MenuItem key={group} value={group}>
                {group.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            select
            name="equipment"
            label="Equipment"
            size="small"
            fullWidth
            defaultValue={exercise?.equipment ?? equipment[0] ?? 'none'}
            disabled={pending}
          >
            {equipment.map(item => (
              <MenuItem key={item} value={item}>
                {item.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControlLabel
            control={<Switch name="isTimed" defaultChecked={exercise?.isTimed ?? false} disabled={pending} />}
            label={<Typography variant="body2">Timed, not counted</Typography>}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            name="imageUrl"
            label="Image URL"
            size="small"
            fullWidth
            defaultValue={exercise?.imageUrl ?? ''}
            disabled={pending}
            helperText="Optional; the app draws a placeholder without one"
          />
        </Grid>
        <Grid size={12}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          {exercise ? 'Save the exercise' : 'Add the exercise'}
        </Button>
      </Box>
    </Stack>
  );
}

/** Deleting an exercise: refused while a template names it. */
export function ExerciseDelete({ exercise }: { exercise: AdminExercise }) {
  const [state, action, pending] = useActionState<TrainingActionState, FormData>(deleteExercise, {});
  const held = exercise.templates.length > 0;

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />
      <input type="hidden" name="id" value={exercise.id} />

      {held ? (
        <Alert severity="info" variant="outlined">
          {exercise.templates.map(entry => entry.title).join(', ')} include{exercise.templates.length === 1 ? 's' : ''}{' '}
          this exercise. Take it out of {exercise.templates.length === 1 ? 'that template' : 'those templates'} first —
          the app drops a template that names an exercise it cannot find.
        </Alert>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No template names {exercise.name}
          {exercise.logged.sessions > 0
            ? `, and the ${exercise.logged.sessions} set(s) members logged keep their own copy of what was done`
            : ''}
          . It can go.
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="confirm"
            label={`Type ${exercise.id}`}
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

/**
 * A workout template: a title, a length, and the exercises in the order
 * they are done.
 *
 * The picker is an autocomplete rather than a list of tick boxes because
 * the **order** is the template — "bench, then incline, then flyes" is a
 * different workout from the same three the other way round, and a tick
 * box has no opinion about order. What is picked is submitted as one hidden
 * field per exercise, in order.
 */
export function TemplateForm({
  template,
  exercises,
  muscleGroups,
}: {
  template?: AdminWorkoutTemplate;
  exercises: AdminExercise[];
  muscleGroups: string[];
}) {
  const [state, action, pending] = useActionState<TrainingActionState, FormData>(saveTemplate, {});
  const [title, setTitle] = useState(template?.title ?? '');
  const [slug, setSlug] = useState(template?.id ?? '');
  const [slugTyped, setSlugTyped] = useState(Boolean(template));
  const [picked, setPicked] = useState<AdminExercise[]>(
    (template?.exerciseIds ?? [])
      .map(id => exercises.find(exercise => exercise.id === id))
      .filter((exercise): exercise is AdminExercise => Boolean(exercise)),
  );
  const [groups, setGroups] = useState<string[]>(template?.muscleGroups ?? []);

  const derived = slugTyped ? slug : slugify(title);
  const fromExercises = [...new Set(picked.map(exercise => exercise.muscleGroup))];

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />
      {template && <input type="hidden" name="id" value={template.id} />}

      {/* The order is the template, so each pick is its own field in order. */}
      {picked.map((exercise, index) => (
        <input key={`${exercise.id}-${index}`} type="hidden" name="exerciseIds" value={exercise.id} />
      ))}
      {groups.map(group => (
        <input key={group} type="hidden" name="muscleGroups" value={group} />
      ))}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            name="title"
            label="Title"
            size="small"
            fullWidth
            required
            value={title}
            onChange={event => setTitle(event.target.value)}
            disabled={pending}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            {...(template ? {} : { name: 'slug' })}
            label="Id"
            size="small"
            fullWidth
            value={derived}
            onChange={event => {
              setSlugTyped(true);
              setSlug(event.target.value);
            }}
            disabled={pending || Boolean(template)}
            helperText={template ? 'Fixed' : 'Written from the title'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField
            name="estimatedMinutes"
            label="Minutes"
            type="number"
            size="small"
            fullWidth
            required
            defaultValue={template?.estimatedMinutes ?? 30}
            disabled={pending}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 1 }}>
          <TextField
            name="sort"
            label="Order"
            type="number"
            size="small"
            fullWidth
            defaultValue={template?.sort ?? 0}
            disabled={pending}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            name="description"
            label="Description"
            size="small"
            fullWidth
            defaultValue={template?.description ?? ''}
            disabled={pending}
            helperText="One line on the card"
          />
        </Grid>

        <Grid size={12}>
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={exercises}
            value={picked}
            onChange={(_event, value) => setPicked(value as AdminExercise[])}
            getOptionLabel={option => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            groupBy={option => option.muscleGroup.replace(/_/g, ' ')}
            disabled={pending}
            renderValue={(value, getItemProps) =>
              value.map((option, index) => (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${index + 1}. ${option.name}`}
                  {...getItemProps({ index })}
                  key={option.id}
                />
              ))
            }
            renderInput={params => (
              <TextField
                {...params}
                label="The exercises, in order"
                size="small"
                helperText={
                  picked.length === 0
                    ? 'Pick them in the order they are done — that order is the workout'
                    : `${picked.length} picked, in that order`
                }
              />
            )}
          />
        </Grid>

        <Grid size={12}>
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={muscleGroups}
            value={groups}
            onChange={(_event, value) => setGroups(value as string[])}
            getOptionLabel={option => option.replace(/_/g, ' ')}
            disabled={pending}
            renderInput={params => (
              <TextField
                {...params}
                label="What it works"
                size="small"
                helperText={
                  groups.length === 0
                    ? `Empty follows the exercises${fromExercises.length > 0 ? ` — ${fromExercises.map(group => group.replace(/_/g, ' ')).join(', ')}` : ''}`
                    : 'Named by hand, so it will not follow the exercises'
                }
              />
            )}
          />
        </Grid>

        <Grid size={12}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          {template ? 'Save the workout' : 'Add the workout'}
        </Button>
      </Box>
    </Stack>
  );
}

/** Deleting a template: nothing points at one, so it simply goes. */
export function TemplateDelete({ template }: { template: AdminWorkoutTemplate }) {
  const [state, action, pending] = useActionState<TrainingActionState, FormData>(deleteTemplate, {});

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <Said state={state} />
      <input type="hidden" name="id" value={template.id} />

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        A workout a member started from {template.title} keeps its own copy of the exercises and its own title, so
        nothing of theirs changes.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="confirm"
            label={`Type ${template.id}`}
            size="small"
            fullWidth
            disabled={pending}
            helperText="This cannot be undone"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
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

export function AddExerciseButton({ muscleGroups, equipment }: { muscleGroups: string[]; equipment: string[] }) {
  return (
    <DialogButton
      label="Add an exercise"
      icon="mingcute:add-line"
      variant="outlined"
      color="inherit"
      maxWidth="md"
      title="A new exercise"
      subtitle="It is in the picker as soon as it is saved, and can then go into a template."
    >
      <ExerciseForm muscleGroups={muscleGroups} equipment={equipment} />
    </DialogButton>
  );
}

export function AddTemplateButton({
  exercises,
  muscleGroups,
}: {
  exercises: AdminExercise[];
  muscleGroups: string[];
}) {
  return (
    <DialogButton
      label="Add a workout"
      icon="mingcute:add-line"
      variant="contained"
      color="primary"
      maxWidth="md"
      title="A new workout template"
      subtitle="The order the exercises are picked in is the order they are done in."
      disabled={exercises.length === 0}
    >
      <TemplateForm exercises={exercises} muscleGroups={muscleGroups} />
    </DialogButton>
  );
}

export function ExerciseRowActions({
  exercise,
  muscleGroups,
  equipment,
}: {
  exercise: AdminExercise;
  muscleGroups: string[];
  equipment: string[];
}) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
      <DialogIconButton
        icon="solar:pen-bold-duotone"
        tooltip={`Edit ${exercise.name}`}
        maxWidth="md"
        title={exercise.name}
        subtitle="A logged set keeps its own copy, so this changes the catalogue from now on."
      >
        <ExerciseForm exercise={exercise} muscleGroups={muscleGroups} equipment={equipment} />
      </DialogIconButton>
      <DialogIconButton
        icon="solar:trash-bin-trash-bold-duotone"
        tooltip={`Delete ${exercise.name}`}
        color="error"
        title={`Delete ${exercise.name}`}
        subtitle="Refused while a template names it."
      >
        <ExerciseDelete exercise={exercise} />
      </DialogIconButton>
    </Stack>
  );
}

export function TemplateRowActions({
  template,
  exercises,
  muscleGroups,
}: {
  template: AdminWorkoutTemplate;
  exercises: AdminExercise[];
  muscleGroups: string[];
}) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
      <DialogIconButton
        icon="solar:pen-bold-duotone"
        tooltip={`Edit ${template.title}`}
        maxWidth="md"
        title={template.title}
        subtitle={`${template.exerciseIds.length} exercise(s), in order.`}
      >
        <TemplateForm template={template} exercises={exercises} muscleGroups={muscleGroups} />
      </DialogIconButton>
      <DialogIconButton
        icon="solar:trash-bin-trash-bold-duotone"
        tooltip={`Delete ${template.title}`}
        color="error"
        title={`Delete ${template.title}`}
        subtitle="A member's own workouts keep their own copy."
      >
        <TemplateDelete template={template} />
      </DialogIconButton>
    </Stack>
  );
}
