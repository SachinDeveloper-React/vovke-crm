import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  DataTable,
  FilterBar,
  Kv,
  Mono,
  OffsetPager,
  Panel,
  SearchFilter,
  SelectFilter,
  Stat,
  TextLink,
} from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, number } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { ExercisePicker, Training } from '@/src/lib/types';

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
export type TrainingQuery = {
  exerciseQ: string;
  muscleGroup: string;
  equipment: string;
  exerciseState: string;
  exerciseLimit: number;
  exerciseOffset: number;
  templateQ: string;
  templateState: string;
  templateLimit: number;
  templateOffset: number;
};

export async function TrainingView({ query }: { query: TrainingQuery }) {
  const [training, picker] = await Promise.all([
    adminGet<Training>('/admin/training', {
      exerciseQ: query.exerciseQ,
      muscleGroup: query.muscleGroup || undefined,
      equipment: query.equipment || undefined,
      exerciseState: query.exerciseState || 'any',
      exerciseLimit: query.exerciseLimit,
      exerciseOffset: query.exerciseOffset,
      templateQ: query.templateQ,
      templateState: query.templateState || 'any',
      templateLimit: query.templateLimit,
      templateOffset: query.templateOffset,
    }),
    /**
     * The exercise list by name, for the template form.
     *
     * A template is built by choosing exercises in order, so that form
     * needs the whole list — one paged with the table beside it would be a
     * form that cannot reach half the gym.
     */
    adminGet<{ total: number; data: ExercisePicker[] }>('/admin/training/exercises/picker'),
  ]);
  const { exercises, templates, totals, muscleGroups, equipment, exercisePage, templatePage } = training;
  const pickable = picker.data;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
        <AddTemplateButton exercises={pickable} muscleGroups={muscleGroups} />
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

      <FilterBar>
        <SearchFilter
          value={query.templateQ}
          placeholder="A workout’s title or id"
          param="templateQ"
          resets="templateOffset"
        />
        <SelectFilter
          label="Workouts"
          param="templateState"
          value={query.templateState}
          options={[
            { value: 'any', label: 'Every workout' },
            { value: 'broken', label: 'Ones the app drops' },
          ]}
          width={190}
          resets="templateOffset"
        />
        <SelectFilter
          label="Rows"
          param="templateLimit"
          value={String(query.templateLimit)}
          options={[25, 50, 100].map(option => ({ value: String(option), label: `${option} rows` }))}
          width={120}
          resets="templateOffset"
        />
      </FilterBar>

      <Panel
        title={
          templatePage.total === totals.templates
            ? `${number(totals.templates)} workout${totals.templates === 1 ? '' : 's'}`
            : `${number(templatePage.total)} of ${number(totals.templates)} workouts`
        }
        subtitle="The order the exercises are listed in is the order they are done in"
        action={<AddTemplateButton exercises={pickable} muscleGroups={muscleGroups} />}
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
              <TemplateRowActions key="a" template={template} exercises={pickable} muscleGroups={muscleGroups} />,
            ],
          }))}
          empty={
            query.templateQ || query.templateState !== 'any'
              ? 'No workout matches those filters.'
              : 'No workouts yet — add an exercise or two, then build one.'
          }
        />
        <OffsetPager
          total={templatePage.total}
          offset={templatePage.offset}
          limit={templatePage.limit}
          param="templateOffset"
        />
      </Panel>

      <FilterBar>
        <SearchFilter
          value={query.exerciseQ}
          placeholder="An exercise’s name or id"
          param="exerciseQ"
          resets="exerciseOffset"
        />
        <SelectFilter
          label="Works"
          param="muscleGroup"
          value={query.muscleGroup}
          options={[
            { value: '', label: 'Any muscle group' },
            ...muscleGroups.map(group => ({ value: group, label: group.replace(/_/g, ' ') })),
          ]}
          width={180}
          resets="exerciseOffset"
        />
        <SelectFilter
          label="Equipment"
          param="equipment"
          value={query.equipment}
          options={[
            { value: '', label: 'Any equipment' },
            ...equipment.map(kit => ({ value: kit, label: kit.replace(/_/g, ' ') })),
          ]}
          width={170}
          resets="exerciseOffset"
        />
        <SelectFilter
          label="Use"
          param="exerciseState"
          value={query.exerciseState}
          options={[
            { value: 'any', label: 'Every exercise' },
            { value: 'logged', label: 'Somebody has done it' },
            { value: 'unused', label: 'Nobody uses it' },
          ]}
          width={190}
          resets="exerciseOffset"
        />
        <SelectFilter
          label="Rows"
          param="exerciseLimit"
          value={String(query.exerciseLimit)}
          options={[25, 50, 100].map(option => ({ value: String(option), label: `${option} rows` }))}
          width={120}
          resets="exerciseOffset"
        />
      </FilterBar>

      <Panel
        title={
          exercisePage.total === totals.exercises
            ? `${number(totals.exercises)} exercise${totals.exercises === 1 ? '' : 's'}`
            : `${number(exercisePage.total)} of ${number(totals.exercises)} exercises`
        }
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
          empty={
            query.exerciseQ || query.muscleGroup || query.equipment || query.exerciseState !== 'any'
              ? 'No exercise matches those filters.'
              : 'No exercises yet — add the first one.'
          }
        />
        <OffsetPager
          total={exercisePage.total}
          offset={exercisePage.offset}
          limit={exercisePage.limit}
          param="exerciseOffset"
        />
      </Panel>

      <Panel title="What to look at first" subtitle="The two things that go quietly wrong here">
        <Kv
          items={[
            {
              // Both lists are a filter away rather than named here: each
              // table is a page now, and a list read off one page would say
              // "none" while six were broken on page three.
              label: 'Templates the app drops',
              value:
                totals.broken === 0 ? (
                  'none'
                ) : (
                  <TextLink href={{ pathname: paths.dashboard.workouts, query: { templateState: 'broken' } }}>
                    {number(totals.broken)} workout(s) — list them
                  </TextLink>
                ),
              hint: 'edit the template and take the missing exercise out, or add an exercise with that id',
            },
            {
              label: 'Exercises nobody uses',
              value:
                totals.unused === 0 ? (
                  'none'
                ) : (
                  <TextLink href={{ pathname: paths.dashboard.workouts, query: { exerciseState: 'unused' } }}>
                    {number(totals.unused)} exercise(s) — list them
                  </TextLink>
                ),
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
