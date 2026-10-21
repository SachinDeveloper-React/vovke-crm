import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { DataTable, Kv, LinkButton, Panel, Stat, TextLink } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { number, percent } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { NutritionOverview } from '@/src/lib/types';

import { NutritionGoalsForm } from './goals-form';

/**
 * What the nutrition side of the app is made of, and the targets a member
 * starts with (RULES N4, N8, N10).
 *
 * The three things an operator owns here are on three pages — the defaults
 * below, the food library, the plans — and this is the one before them: a
 * library with no quick-add tiles, a plan library where everybody is on the
 * server's choice, or defaults nobody has revisited since launch are all
 * things you only see by counting.
 */
export async function NutritionView() {
  const overview = await adminGet<NutritionOverview>('/admin/nutrition/overview');
  const { foods, plans, members, defaults } = overview;

  const share = (count: number) => (members.profiles === 0 ? '—' : percent(count / members.profiles, 0));

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
        <LinkButton href={paths.dashboard.foods} size="small" variant="contained">
          Food library
        </LinkButton>
        <LinkButton href={paths.dashboard.dietPlans} size="small" color="inherit" variant="outlined">
          Diet plans
        </LinkButton>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Foods on offer"
            value={number(foods.active)}
            icon="solar:donut-bitten-bold-duotone"
            goodDirection="none"
            hint={`${number(foods.quickAdd)} quick-add tiles · ${number(foods.custom)} members’ own`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Plans on offer"
            value={number(plans.active)}
            icon="solar:clipboard-list-bold-duotone"
            goodDirection="none"
            hint={`${number(plans.total)} written`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Members logging food"
            value={number(members.logging)}
            icon="solar:fork-knife-bold-duotone"
            goodDirection="up"
            hint={`${number(members.entries)} meal(s) logged`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Set their own targets"
            value={number(members.profiles)}
            icon="solar:target-bold-duotone"
            goodDirection="none"
            hint="everybody else is on the defaults below"
          />
        </Grid>
      </Grid>

      <Panel
        title="What a member starts with"
        subtitle="⚙ nutrition.* — the goals and preferences of anybody who has not set their own"
        note="Changing these does not touch a member who has already set their own targets: those live on their profile. The macro sum under the boxes is the check — a calorie target its own macros cannot reach is a plan nobody can follow."
      >
        <NutritionGoalsForm defaults={defaults} />
      </Panel>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="What members eat by" subtitle="Of those who set a preference" dense>
            <DataTable
              columns={[{ label: 'Preference' }, { label: 'Members', align: 'right' }, { label: 'Share', align: 'right' }]}
              rows={[
                ...members.dietTypes.map(row => ({
                  key: `diet:${row.value}`,
                  cells: [
                    <Stack key="n" direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Label color="info" variant="soft">
                        diet
                      </Label>
                      <Typography variant="body2">{row.value.replace(/_/g, ' ')}</Typography>
                    </Stack>,
                    <Typography key="m" variant="body2" sx={{ textAlign: 'right' }}>
                      {number(row.members)}
                    </Typography>,
                    <Typography key="s" variant="caption" sx={{ textAlign: 'right', color: 'text.disabled' }}>
                      {share(row.members)}
                    </Typography>,
                  ],
                })),
                ...members.mealPlans.map(row => ({
                  key: `meal:${row.value}`,
                  cells: [
                    <Stack key="n" direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Label color="default" variant="soft">
                        plan
                      </Label>
                      <Typography variant="body2">{row.value.replace(/_/g, ' ')}</Typography>
                    </Stack>,
                    <Typography key="m" variant="body2" sx={{ textAlign: 'right' }}>
                      {number(row.members)}
                    </Typography>,
                    <Typography key="s" variant="caption" sx={{ textAlign: 'right', color: 'text.disabled' }}>
                      {share(row.members)}
                    </Typography>,
                  ],
                })),
              ]}
              empty="Nobody has set a preference yet."
            />
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="What they are aiming at" subtitle="And the average target each goal carries" dense>
            <DataTable
              columns={[
                { label: 'Goal' },
                { label: 'Members', align: 'right' },
                { label: 'Average target', align: 'right' },
              ]}
              rows={members.goals.map(row => ({
                key: row.value,
                cells: [
                  <Typography key="g" variant="body2">
                    {row.value.replace(/_/g, ' ')}
                  </Typography>,
                  <Typography key="m" variant="body2" sx={{ textAlign: 'right' }}>
                    {number(row.members)}
                  </Typography>,
                  <Typography key="k" variant="caption" sx={{ textAlign: 'right', color: 'text.disabled' }}>
                    {row.members === 0 ? '—' : `${number(row.averageCalories)} kcal`}
                  </Typography>,
                ],
              }))}
              empty="Nobody has set a goal yet."
            />
          </Panel>
        </Grid>
      </Grid>

      <Panel
        title="The plans members are on"
        subtitle={`${number(plans.chosen)} chose one by hand · ${number(plans.serverChoice)} take the server’s choice`}
        action={
          <LinkButton href={paths.dashboard.dietPlans} size="small" color="inherit" variant="outlined">
            Edit the plans
          </LinkButton>
        }
        dense
      >
        <DataTable
          columns={[{ label: 'Plan' }, { label: 'Days', align: 'right' }, { label: 'Members', align: 'right' }]}
          rows={plans.data.map(plan => ({
            key: plan.id,
            tone: plan.active ? 'default' : 'danger',
            cells: [
              <Stack key="p" direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                <TextLink href={paths.dashboard.dietPlans}>{plan.name}</TextLink>
                {!plan.active && (
                  <Label color="error" variant="soft">
                    retired
                  </Label>
                )}
              </Stack>,
              <Typography key="d" variant="body2" sx={{ textAlign: 'right' }}>
                {number(plan.days)}
              </Typography>,
              <Typography key="m" variant="body2" sx={{ textAlign: 'right' }}>
                {number(plan.members)}
              </Typography>,
            ],
          }))}
          empty="No plans yet."
        />
      </Panel>

      <Panel title="Where each of these lives" subtitle="And what changing it touches">
        <Kv
          items={[
            {
              label: 'The defaults above',
              value: '⚙ nutrition.* — one row in app config',
              hint: 'a member who set their own targets keeps them',
            },
            {
              label: 'The food library',
              value: <TextLink href={paths.dashboard.foods}>{number(foods.total)} global rows, and a sheet to import</TextLink>,
              hint: 'correcting a figure never rewrites what anybody already ate',
            },
            {
              label: 'Members’ own foods',
              value: `${number(foods.custom)} — private to each member`,
              hint: 'counted here, never listed: an operator cannot read or write them',
            },
            {
              label: 'Diet plans',
              value: <TextLink href={paths.dashboard.dietPlans}>{number(plans.total)} programmes of days</TextLink>,
              hint: 'retiring one hands everybody on it back to the server’s choice',
            },
          ]}
        />
      </Panel>
    </Stack>
  );
}
