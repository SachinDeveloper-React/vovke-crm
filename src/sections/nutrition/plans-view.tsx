import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  DataTable,
  FilterBar,
  LinkButton,
  Mono,
  OffsetPager,
  Panel,
  SearchFilter,
  SelectFilter,
  Stat,
} from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, number } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { AdminPlan, AdminPlans, NutritionOverview } from '@/src/lib/types';

import { AddPlanButton, PlanRowActions } from './plan-forms';

/** The day's calories, which is the figure somebody checks a plan by. */
function dayTotals(plan: AdminPlan): { calories: number; meals: number } {
  const meals = plan.days.reduce((sum, day) => sum + day.meals.length, 0);
  const calories = plan.days.reduce(
    (sum, day) => sum + day.meals.reduce((inner, meal) => inner + meal.calories, 0),
    0,
  );
  return { meals, calories: plan.days.length === 0 ? 0 : Math.round(calories / plan.days.length) };
}

/**
 * The diet plan library (RULES N10).
 *
 * A member either picks a plan by name or lets the server pick one that
 * suits their diet type and meal plan — so the two columns that matter are
 * who is on each one, and what it suits. A plan that suits nothing is a
 * plan the server will never choose.
 *
 * Retiring is the usual way to end one: it leaves the library, everybody on
 * it falls back to the server's choice, and the row their history points at
 * stays.
 */
export type DietPlansQuery = { q: string; state: string; sort: string; limit: number; offset: number };

export async function DietPlansView({ query }: { query: DietPlansQuery }) {
  const [library, overview] = await Promise.all([
    adminGet<AdminPlans>('/admin/diet-plans', {
      q: query.q,
      state: query.state || 'any',
      sort: query.sort,
      limit: query.limit,
      offset: query.offset,
    }),
    adminGet<NutritionOverview>('/admin/nutrition/overview'),
  ]);
  const plans = library.data;

  // The overview carries the ten plans members are actually on, so a plan
  // further down the library reads as 0 rather than as a figure this page
  // would have to count itself.
  const membersOf = new Map(overview.plans.data.map(entry => [entry.id, entry.members]));

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
        <AddPlanButton />
        <LinkButton href={paths.dashboard.foods} size="small" color="inherit" variant="outlined">
          Food library
        </LinkButton>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="On offer"
            value={number(overview.plans.active)}
            icon="solar:clipboard-list-bold-duotone"
            goodDirection="none"
            hint={`${number(overview.plans.total)} written · ${number(overview.plans.total - overview.plans.active)} retired`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Chose one by hand"
            value={number(overview.plans.chosen)}
            icon="solar:hand-stars-bold-duotone"
            goodDirection="none"
            hint="the rest take the server’s choice"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="On the server’s choice"
            value={number(overview.plans.serverChoice)}
            icon="solar:magic-stick-3-bold-duotone"
            goodDirection="none"
            hint="picked from what suits their preferences"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Days written"
            value={number(library.totals.days)}
            icon="solar:calendar-bold-duotone"
            goodDirection="none"
            hint="across every plan, in rotation"
          />
        </Grid>
      </Grid>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="A plan’s name, words or id" />
        <SelectFilter
          label="State"
          param="state"
          value={query.state}
          options={[
            { value: 'any', label: 'Every plan' },
            { value: 'active', label: 'On offer' },
            { value: 'retired', label: 'Retired' },
          ]}
          width={160}
        />
        <SelectFilter
          label="Sort"
          param="sort"
          value={query.sort}
          options={[
            { value: 'shelf', label: 'Library order' },
            { value: 'newest', label: 'Newest' },
            { value: 'name', label: 'By name' },
          ]}
          width={160}
        />
        <SelectFilter
          label="Rows"
          param="limit"
          value={String(query.limit)}
          options={[10, 25, 50].map(option => ({ value: String(option), label: `${option} plans` }))}
          width={130}
        />
      </FilterBar>

      <Panel
        title={
          library.total === library.totals.plans
            ? `${number(library.total)} plan${library.total === 1 ? '' : 's'}`
            : `${number(library.total)} of ${number(library.totals.plans)} plans`
        }
        subtitle="Days run in rotation, so a 3-day plan repeats every third day"
        action={<AddPlanButton />}
        note="A plan is written and read whole: saving replaces the entire programme, which is what makes “change Tuesday” one edit with one result rather than a sequence of calls that can half-fail. Ten a page, because a plan carries every meal of every day of itself."
        dense
      >
        <DataTable
          columns={[
            { label: 'Plan' },
            { label: 'Suits' },
            { label: 'Days', align: 'right' },
            { label: 'A day', align: 'right' },
            { label: 'On it', align: 'right' },
            { label: '', align: 'right', width: 190 },
          ]}
          rows={plans.map(plan => {
            const totals = dayTotals(plan);
            return {
              key: plan.id,
              tone: plan.active ? 'default' : 'danger',
              cells: [
                <Stack key="plan" spacing={0.25}>
                  <Typography variant="subtitle2">
                    {plan.emoji} {plan.name}
                  </Typography>
                  {plan.description && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {plan.description}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {!plan.active && (
                      <Label color="error" variant="soft">
                        retired
                      </Label>
                    )}
                    <Mono>{plan.id}</Mono>
                  </Stack>
                </Stack>,
                <Stack key="suits" spacing={0.5}>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {plan.dietTypes.map(type => (
                      <Label key={type} color="info" variant="soft">
                        {type.replace(/_/g, ' ')}
                      </Label>
                    ))}
                  </Stack>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {plan.mealPlans.map(meal => (
                      <Label key={meal} color="default" variant="soft">
                        {meal.replace(/_/g, ' ')}
                      </Label>
                    ))}
                  </Stack>
                </Stack>,
                <Stack key="days" spacing={0.25} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{number(plan.days.length)}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {number(totals.meals)} meal(s)
                  </Typography>
                </Stack>,
                <Stack key="kcal" spacing={0.25} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{number(totals.calories)}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    kcal, average
                  </Typography>
                </Stack>,
                <Stack key="members" spacing={0.25} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{number(membersOf.get(plan.id) ?? 0)}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {plan.updatedAt ? ago(plan.updatedAt) : '—'}
                  </Typography>
                </Stack>,
                <PlanRowActions key="actions" plan={plan} members={membersOf.get(plan.id) ?? 0} />,
              ],
            };
          })}
          empty={
            query.q || query.state !== 'any' ? 'No plan matches those filters.' : 'No plans yet — add the first one.'
          }
        />
        <OffsetPager total={library.total} offset={library.offset} limit={library.limit} />
      </Panel>

      {/* The first three of this page, written out day by day — paging the
          library above is also how an operator reaches the rest. */}
      {plans.slice(0, 3).map(plan => (
        <Panel
          key={plan.id}
          title={`${plan.emoji} ${plan.name}`}
          subtitle={`${number(plan.days.length)} day(s), in rotation`}
          action={<PlanRowActions plan={plan} members={membersOf.get(plan.id) ?? 0} />}
          dense
        >
          <DataTable
            columns={[
              { label: 'Day' },
              { label: 'Meal' },
              { label: 'At' },
              { label: 'Calories', align: 'right' },
              { label: 'P / C / F', align: 'right' },
              { label: 'Items' },
            ]}
            rows={plan.days.flatMap((day, index) =>
              day.meals.map((meal, at) => ({
                key: `${plan.id}:${index}:${at}`,
                cells: [
                  <Typography key="day" variant="body2">
                    {at === 0 ? day.label || `Day ${index + 1}` : ''}
                  </Typography>,
                  <Label key="slot" color="default" variant="soft">
                    {meal.slot}
                  </Label>,
                  <Typography key="time" variant="body2">
                    {meal.time}
                  </Typography>,
                  <Typography key="kcal" variant="body2" sx={{ textAlign: 'right' }}>
                    {number(meal.calories)}
                  </Typography>,
                  <Typography key="macros" variant="caption" sx={{ textAlign: 'right', color: 'text.disabled' }}>
                    {meal.proteinG} / {meal.carbsG} / {meal.fatsG} g
                  </Typography>,
                  <Typography key="items" variant="caption" sx={{ color: 'text.secondary' }}>
                    {meal.items.map(item => (item.quantity ? `${item.name} (${item.quantity})` : item.name)).join(', ') || '—'}
                  </Typography>,
                ],
              })),
            )}
            empty="No meals in this plan."
          />
        </Panel>
      ))}
    </Stack>
  );
}
