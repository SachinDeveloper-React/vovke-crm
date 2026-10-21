import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  CursorPager,
  DataTable,
  FilterBar,
  LinkButton,
  Mono,
  Panel,
  SearchFilter,
  Stat,
} from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, number } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { FoodPage, NutritionOverview } from '@/src/lib/types';

import { AddFoodButton, FoodRowActions } from './food-forms';
import { ImportFoodsButton } from './import-form';

export type FoodsQuery = { q: string; cursor: string; limit: number };

/**
 * The global food library (RULES N8, N11).
 *
 * These are the rows every member searches, browses and quick-adds from —
 * "Chapati · 1 piece (40 g) · 104 kcal". A member's own custom foods are
 * private to them and are not reachable here at all; the count on the
 * right is the only thing this page knows about them.
 *
 * Nothing here rewrites history: a logged meal keeps its own copy of the
 * figures, so correcting a calorie count fixes the library from now on and
 * leaves every meal already eaten exactly as it was.
 */
export async function FoodsView({ query }: { query: FoodsQuery }) {
  const [page, overview] = await Promise.all([
    adminGet<FoodPage>('/admin/foods', {
      q: query.q || undefined,
      cursor: query.cursor || undefined,
      limit: query.limit,
    }),
    adminGet<NutritionOverview>('/admin/nutrition/overview'),
  ]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
        <AddFoodButton />
        <ImportFoodsButton />
        <LinkButton href={paths.dashboard.nutrition} size="small" color="inherit" variant="outlined">
          Goals &amp; defaults
        </LinkButton>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="In the library"
            value={number(overview.foods.active)}
            icon="solar:donut-bitten-bold-duotone"
            goodDirection="none"
            hint={`${number(overview.foods.total)} rows · ${number(overview.foods.retired)} retired`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Quick-add tiles"
            value={number(overview.foods.quickAdd)}
            icon="solar:bolt-bold-duotone"
            goodDirection="none"
            hint="the shortcuts on the add-meal screen"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Members’ own foods"
            value={number(overview.foods.custom)}
            icon="solar:user-hand-up-bold-duotone"
            goodDirection="none"
            hint="private to each member — counted, never listed"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Meals logged"
            value={number(overview.members.entries)}
            icon="solar:fork-knife-bold-duotone"
            goodDirection="up"
            hint={`${number(overview.members.logging)} member(s) have logged something`}
          />
        </Grid>
      </Grid>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="Name" />
      </FilterBar>

      <Panel
        title={`${number(page.total)} food${page.total === 1 ? '' : 's'}`}
        subtitle={query.q ? `matching “${query.q}”` : 'retired rows included'}
        action={<ImportFoodsButton />}
        note="A sheet is matched by name: importing the same file twice corrects the same rows rather than adding a second copy of each. Figures are per portion, exactly as the app shows them."
        dense
      >
        <DataTable
          columns={[
            { label: 'Food' },
            { label: 'Calories', align: 'right' },
            { label: 'Protein', align: 'right' },
            { label: 'Carbs', align: 'right' },
            { label: 'Fats', align: 'right' },
            { label: 'Fibre', align: 'right' },
            { label: 'Last written' },
            { label: '', align: 'right', width: 190 },
          ]}
          rows={page.data.map(food => ({
            key: food.id,
            tone: food.active ? 'default' : 'danger',
            cells: [
              <Stack key="food" spacing={0.25}>
                <Typography variant="subtitle2">
                  {food.emoji} {food.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {food.portion}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {food.quickAdd && (
                    <Label color="info" variant="soft">
                      quick add
                    </Label>
                  )}
                  {!food.active && (
                    <Label color="error" variant="soft">
                      retired
                    </Label>
                  )}
                </Stack>
                <Mono>{food.id}</Mono>
              </Stack>,
              <Typography key="kcal" variant="subtitle2" sx={{ textAlign: 'right' }}>
                {number(food.calories)}
              </Typography>,
              <Typography key="p" variant="body2" sx={{ textAlign: 'right' }}>
                {food.proteinG} g
              </Typography>,
              <Typography key="c" variant="body2" sx={{ textAlign: 'right' }}>
                {food.carbsG} g
              </Typography>,
              <Typography key="f" variant="body2" sx={{ textAlign: 'right' }}>
                {food.fatsG} g
              </Typography>,
              <Typography key="fi" variant="body2" sx={{ textAlign: 'right' }}>
                {food.fiberG} g
              </Typography>,
              <Stack key="who" spacing={0.25}>
                <Typography variant="caption">{food.updatedBy}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {food.updatedAt ? ago(food.updatedAt) : '—'}
                </Typography>
              </Stack>,
              <FoodRowActions key="actions" food={food} />,
            ],
          }))}
          empty={query.q ? 'Nothing matches that.' : 'The library is empty — add a food, or import a sheet.'}
        />
        <CursorPager next={page.nextCursor} cursor={query.cursor} />
      </Panel>
    </Stack>
  );
}
