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
import { ago, coins, number } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { Achievements } from '@/src/lib/types';

import { AchievementRowActions, AddAchievementButton } from './achievement-forms';

/**
 * The badge shelf (RULES C7).
 *
 * Two things unlock a badge and they are independent: its own **rule**,
 * which watches a figure the member already has, and a **challenge** that
 * awards it on completion. A badge with neither can never be earned, which
 * is invisible on a shelf of tiles and obvious in a table — so this marks
 * them, and the count is a stat above.
 *
 * A badge is unlocked once and never taken back, which is also why nothing
 * here retires one: changing what it says changes the shelf for everybody,
 * and deleting is refused while anybody holds it.
 */
export type AchievementsQuery = {
  q: string;
  state: string;
  metric: string;
  sort: string;
  limit: number;
  offset: number;
};

export async function AchievementsView({ query }: { query: AchievementsQuery }) {
  const achievements = await adminGet<Achievements>('/admin/achievements', {
    q: query.q,
    state: query.state || 'any',
    metric: query.metric || undefined,
    sort: query.sort,
    limit: query.limit,
    offset: query.offset,
  });
  const { data, totals, config, metrics, rules } = achievements;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
        <AddAchievementButton metrics={metrics} rules={rules} />
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Badges"
            value={number(totals.achievements)}
            icon="solar:medal-ribbons-star-bold-duotone"
            goodDirection="none"
            hint="on the shelf, in order"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Unlocked"
            value={number(totals.unlocked)}
            icon="solar:cup-star-bold-duotone"
            goodDirection="up"
            hint="badge × member, all time"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Nothing unlocks"
            value={number(totals.unreachable)}
            icon="solar:lock-keyhole-bold-duotone"
            goodDirection="down"
            hint="no rule, and no challenge awards them"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Coins on offer"
            value={coins(totals.coinsOnOffer)}
            icon="solar:dollar-minimalistic-bold-duotone"
            goodDirection="none"
            hint={config.achievementCoinsEnabled ? 'paid on unlock' : 'held: badge coins are switched off'}
          />
        </Grid>
      </Grid>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="Label, title or id" />
        <SelectFilter
          label="State"
          param="state"
          value={query.state}
          options={[
            { value: 'any', label: 'Every badge' },
            { value: 'held', label: 'Somebody holds it' },
            { value: 'unheld', label: 'Nobody holds it' },
            { value: 'unreachable', label: 'Nothing unlocks it' },
          ]}
          width={190}
        />
        <SelectFilter
          label="Counts"
          param="metric"
          value={query.metric}
          options={[{ value: '', label: 'Any metric' }, ...metrics.map(one => ({ value: one, label: one }))]}
          width={150}
        />
        <SelectFilter
          label="Sort"
          param="sort"
          value={query.sort}
          options={[
            { value: 'shelf', label: 'Shelf order' },
            { value: 'newest', label: 'Newest' },
            { value: 'label', label: 'By label' },
          ]}
          width={150}
        />
        <SelectFilter
          label="Rows"
          param="limit"
          value={String(query.limit)}
          options={[25, 50, 100].map(option => ({ value: String(option), label: `${option} rows` }))}
          width={120}
        />
      </FilterBar>

      <Panel
        title={
          achievements.total === totals.achievements
            ? `${number(totals.achievements)} badge${totals.achievements === 1 ? '' : 's'}`
            : `${number(achievements.total)} of ${number(totals.achievements)} badges`
        }
        subtitle={config.achievementCoinsEnabled ? 'Badge coins are being paid' : 'Badge coins are off — every payout is held'}
        action={<AddAchievementButton metrics={metrics} rules={rules} />}
        note="A badge is unlocked once and never taken back, so nothing here takes one off a member who earned it: deleting is refused while anybody holds it, and raising a threshold only changes what the next member has to do."
        dense
      >
        <DataTable
          columns={[
            { label: 'Badge' },
            { label: 'Stands for', align: 'right' },
            { label: 'Unlocked by' },
            { label: 'Pays', align: 'right' },
            { label: 'Held', align: 'right' },
            { label: '', align: 'right', width: 110 },
          ]}
          rows={data.map(badge => ({
            key: badge.id,
            tone: badge.unreachable ? 'danger' : 'default',
            cells: [
              <Stack key="badge" spacing={0.25}>
                <Typography variant="subtitle2">{badge.label}</Typography>
                {badge.title !== badge.label && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {badge.title}
                  </Typography>
                )}
                <Mono>{badge.id}</Mono>
              </Stack>,
              <Stack key="value" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2">{number(badge.value)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {badge.metric}
                </Typography>
              </Stack>,
              <Stack key="rule" spacing={0.5}>
                {badge.rule ? (
                  <Typography variant="body2">
                    {badge.rule.replace(/_/g, ' ')}
                    {badge.threshold !== null ? ` ≥ ${number(badge.threshold)}` : ''}
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    no rule of its own
                  </Typography>
                )}
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {badge.awardedBy.map(entry => (
                    <Label key={entry.id} color={entry.active ? 'info' : 'default'} variant="soft">
                      {entry.title}
                    </Label>
                  ))}
                  {badge.unreachable && (
                    <Label color="error" variant="soft">
                      nothing unlocks it
                    </Label>
                  )}
                </Stack>
              </Stack>,
              <Stack key="pays" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{coins(badge.rewardCoins)} coins</Typography>
                {badge.rewardCoins > 0 && !config.achievementCoinsEnabled && (
                  <Typography variant="caption" sx={{ color: 'warning.main' }}>
                    held
                  </Typography>
                )}
              </Stack>,
              <Stack key="held" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{number(badge.members)}</Typography>
                {badge.lastAt && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {ago(badge.lastAt)}
                  </Typography>
                )}
              </Stack>,
              <AchievementRowActions key="actions" achievement={badge} metrics={metrics} rules={rules} />,
            ],
          }))}
          empty={
            query.q || query.state !== 'any' || query.metric
              ? 'Nothing matches those filters.'
              : 'No badges yet — add the first one.'
          }
        />
        <OffsetPager total={achievements.total} offset={achievements.offset} limit={achievements.limit} />
      </Panel>

      <Panel title="What to do about the ones nothing unlocks" subtitle="A badge nobody can earn still sits on the shelf">
        <Kv
          items={[
            {
              // A link to the filter rather than a list read off one page:
              // the shelf is paged, and "none" counted from the twenty-five
              // on screen would be a different sentence from the truth.
              label: 'Unreachable',
              value:
                totals.unreachable === 0 ? (
                  'none'
                ) : (
                  <TextLink href={{ pathname: paths.dashboard.achievements, query: { state: 'unreachable' } }}>
                    {number(totals.unreachable)} badge(s) — list them
                  </TextLink>
                ),
              hint: 'give each a rule, or point a challenge at it',
            },
            {
              label: 'The two ways in',
              value: 'a rule on the badge, or a challenge with “awards a badge” set to it',
              hint: 'both may apply; whichever happens first unlocks it',
            },
            {
              label: 'Badge coins',
              value: config.achievementCoinsEnabled ? 'on — unlocks pay immediately' : 'off — unlocks are recorded, coins are held',
              hint: '⚙ coins.achievements.enabled, on App config',
            },
            {
              label: 'The challenges',
              value: <TextLink href={paths.dashboard.challenges}>What each one asks for and pays</TextLink>,
            },
          ]}
        />
      </Panel>
    </Stack>
  );
}
