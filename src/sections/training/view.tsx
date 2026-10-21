import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { DataTable, Kv, Mono, Panel, Stat } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, number } from '@/src/lib/format';
import type { Training } from '@/src/lib/types';

import {
  AddExerciseButton,
  AddTemplateButton,
  ExerciseRowActions,
  TemplateRowActions,
} from './forms';

/**
 * The gym: the exercise list, and the workout templates built from it.
 *
 * Both were seed data and both are read live by the app — the template
 * carousel on the workout screen and the exercise picker behind it.
 *
 * The one relationship to watch is a template's exercises. The app carries
 * whole exercises inside a template rather than ids, so a template naming
 * an exercise that is not there is one the phone *drops* — silently, from
 * the member's point of view. That is the `missing` column, the broken
 * count above, and the reason an exercise a template uses cannot be
 * deleted.
 *
 * Nothing here touches a workout anybody has done: a finished session keeps
 * its own copy of every exercise and set, so correcting a name or a muscle
 * group fixes the catalogue from now on and leaves the history alone.
 */
export async function TrainingView() {
  const training = await adminGet<Training>('/admin/training');
  const { exercises, templates, totals, muscleGroups, equipment } = training;

  const broken = templates.filter(template => template.missing.length > 0);
  const unused = exercises.filter(exercise => exercise.templates.length === 0 && exercise.logged.sessions === 0);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
        <AddTemplateButton exercises={exercises} muscleGroups={muscleGroups} />
        <AddExerciseButton muscleGroups={muscleGroups} equipment={equipment} />
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Workouts on offer"
            value={number(totals.templates)}
            icon="solar:dumbbell-large-bold-duotone"
            goodDirection="none"
            hint="the templates on the workout screen"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Exercises"
            value={number(totals.exercises)}
            icon="solar:list-check-bold-duotone"
            goodDirection="none"
            hint={`${number(totals.unused)} in no template and nobody’s log`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Sets logged"
            value={number(totals.sessions)}
            icon="solar:chart-square-bold-duotone"
            goodDirection="up"
            hint="across every member, all time"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Templates the app drops"
            value={number(totals.broken)}
            icon="solar:danger-triangle-bold-duotone"
            goodDirection="down"
            hint="they name an exercise that is not there"
          />
        </Grid>
      </Grid>

      <Panel
        title={`${number(totals.templates)} workout${totals.templates === 1 ? '' : 's'}`}
        subtitle="The order the exercises are listed in is the order they are done in"
        action={<AddTemplateButton exercises={exercises} muscleGroups={muscleGroups} />}
        note="A template carries whole exercises to the app, so one naming an exercise that has gone is dropped on the phone rather than shown with a gap. That is what the “missing” tag is, and why an exercise a template uses cannot be deleted."
        dense
      >
        <DataTable
          columns={[
            { label: 'Workout' },
            { label: 'Works' },
            { label: 'Minutes', align: 'right' },
            { label: 'Exercises, in order' },
            { label: '', align: 'right', width: 110 },
          ]}
          rows={templates.map(template => ({
            key: template.id,
            tone: template.missing.length > 0 ? 'danger' : 'default',
            cells: [
              <Stack key="t" spacing={0.25}>
                <Typography variant="subtitle2">{template.title}</Typography>
                {template.description && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {template.description}
                  </Typography>
                )}
                <Mono>{template.id}</Mono>
              </Stack>,
              <Stack key="g" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {template.muscleGroups.map(group => (
                  <Label key={group} color="info" variant="soft">
                    {group.replace(/_/g, ' ')}
                  </Label>
                ))}
              </Stack>,
              <Typography key="m" variant="body2" sx={{ textAlign: 'right' }}>
                {number(template.estimatedMinutes)}
              </Typography>,
              <Stack key="e" spacing={0.25}>
                <Typography variant="body2">
                  {template.exercises.map((entry, index) => `${index + 1}. ${entry.name ?? entry.id}`).join(' · ')}
                </Typography>
                {template.missing.length > 0 && (
                  <Label color="error" variant="soft">
                    missing: {template.missing.join(', ')}
                  </Label>
                )}
              </Stack>,
              <TemplateRowActions key="a" template={template} exercises={exercises} muscleGroups={muscleGroups} />,
            ],
          }))}
          empty="No workouts yet — add an exercise or two, then build one."
        />
      </Panel>

      <Panel
        title={`${number(totals.exercises)} exercise${totals.exercises === 1 ? '' : 's'}`}
        subtitle="What members pick from, and what the templates are built out of"
        action={<AddExerciseButton muscleGroups={muscleGroups} equipment={equipment} />}
        dense
      >
        <DataTable
          columns={[
            { label: 'Exercise' },
            { label: 'Works' },
            { label: 'Equipment' },
            { label: 'In templates' },
            { label: 'Logged', align: 'right' },
            { label: '', align: 'right', width: 110 },
          ]}
          rows={exercises.map(exercise => ({
            key: exercise.id,
            cells: [
              <Stack key="x" spacing={0.25}>
                <Typography variant="subtitle2">{exercise.name}</Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {exercise.isTimed && (
                    <Label color="warning" variant="soft">
                      timed
                    </Label>
                  )}
                  <Mono>{exercise.id}</Mono>
                </Stack>
              </Stack>,
              <Label key="g" color="info" variant="soft">
                {exercise.muscleGroup.replace(/_/g, ' ')}
              </Label>,
              <Typography key="q" variant="body2">
                {exercise.equipment.replace(/_/g, ' ')}
              </Typography>,
              <Stack key="t" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {exercise.templates.length === 0 ? (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    none
                  </Typography>
                ) : (
                  exercise.templates.map(entry => (
                    <Label key={entry.id} color="default" variant="soft">
                      {entry.title}
                    </Label>
                  ))
                )}
              </Stack>,
              <Stack key="l" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{number(exercise.logged.sessions)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {exercise.logged.members > 0 ? `${number(exercise.logged.members)} member(s)` : '—'}
                  {exercise.logged.lastAt ? ` · ${ago(exercise.logged.lastAt)}` : ''}
                </Typography>
              </Stack>,
              <ExerciseRowActions key="a" exercise={exercise} muscleGroups={muscleGroups} equipment={equipment} />,
            ],
          }))}
          empty="No exercises yet — add the first one."
        />
      </Panel>

      <Panel title="What to look at first" subtitle="The two things that go quietly wrong here">
        <Kv
          items={[
            {
              label: 'Templates the app drops',
              value:
                broken.length === 0
                  ? 'none'
                  : broken.map(template => `${template.title} → ${template.missing.join(', ')}`).join(' · '),
              hint: 'edit the template and take the missing exercise out, or add an exercise with that id',
            },
            {
              label: 'Exercises nobody uses',
              value: unused.length === 0 ? 'none' : unused.map(exercise => exercise.name).join(' · '),
              hint: 'in no template and in nobody’s log — typed and forgotten, or waiting for a workout',
            },
            {
              label: 'Why an edit is safe',
              value: 'a finished workout keeps its own copy of every exercise and set',
              hint: 'so correcting a name or a muscle group never rewrites anybody’s history',
            },
            {
              label: 'What the app reads',
              value: 'GET /workout-templates and GET /exercises, live',
              hint: 'a workout added here is on the screen at the next fetch',
            },
          ]}
        />
      </Panel>
    </Stack>
  );
}
