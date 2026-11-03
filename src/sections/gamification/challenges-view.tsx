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
import type { AchievementPicker, Challenges, ChallengeState } from '@/src/lib/types';

import { AddChallengeButton, ChallengeRowActions } from './challenge-forms';

const TONE: Record<ChallengeState, 'success' | 'info' | 'default' | 'error'> = {
  live: 'success',
  upcoming: 'info',
  ended: 'default',
  retired: 'error',
};

/** What each metric counts, so a goal of 70,000 is never a bare number. */
const UNITS: Record<string, string> = {
  steps: 'steps',
  calories: 'kcal',
  minutes: 'min',
  days: 'days',
  workouts: 'workouts',
};

/**
 * The challenge board, as the operator writes it (RULES C1–C5).
 *
 * Every member is enrolled in every open challenge, so there is no
 * enrolment to manage here — what there is to manage is the catalogue:
 * what each one asks for, what it pays, and whether it is open.
 *
 * The column that decides anything is `completions`. A challenge nobody has
 * ever finished is too hard or broken; one with completions the economy has
 * not paid is the daily ceiling or the coins switch rather than the
 * challenge, and the banner above says which of those is off.
 */
export type ChallengesQuery = {
  q: string;
  state: string;
  cadence: string;
  sort: string;
  limit: number;
  offset: number;
};

export async function ChallengesView({ query }: { query: ChallengesQuery }) {
  const [challenges, badges] = await Promise.all([
    adminGet<Challenges>('/admin/challenges', {
      q: query.q,
      state: query.state || 'any',
      cadence: query.cadence || undefined,
      sort: query.sort,
      limit: query.limit,
      offset: query.offset,
    }),
    /**
     * The badge shelf by name alone, for the dropdown on the form.
     *
     * Not the Achievements list: that one is paged and carries who holds
     * each badge and what pays it, and a picker that offered page one of it
     * would be a form that cannot reach half the shelf.
     */
    adminGet<AchievementPicker>('/admin/achievements/picker'),
  ]);
  const { data, totals, config, metrics, cadences, attention } = challenges;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
        <AddChallengeButton badges={badges.data} metrics={metrics} cadences={cadences} />
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="On the board"
            value={number(totals.live)}
            icon="solar:flag-2-bold-duotone"
            goodDirection="none"
            hint={`${number(totals.challenges)} written · ${number(totals.upcoming)} not open yet · ${number(totals.retired)} retired`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Completions"
            value={number(totals.completions)}
            icon="solar:check-circle-bold-duotone"
            goodDirection="up"
            hint="all time, every challenge"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Coins paid"
            value={coins(totals.granted)}
            icon="solar:dollar-minimalistic-bold-duotone"
            goodDirection="none"
            hint="what the economy actually granted"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Unpaid completions"
            value={number(totals.unpaid)}
            icon="solar:hourglass-bold-duotone"
            goodDirection="down"
            hint="capped by the daily ceiling, or waiting on the switch"
          />
        </Grid>
      </Grid>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="Title, description or id" />
        <SelectFilter
          label="State"
          param="state"
          value={query.state}
          options={[
            { value: 'any', label: 'Every state' },
            { value: 'live', label: 'On the board' },
            { value: 'upcoming', label: 'Not open yet' },
            { value: 'ended', label: 'Ended' },
            { value: 'retired', label: 'Retired' },
          ]}
          width={160}
        />
        <SelectFilter
          label="Cadence"
          param="cadence"
          value={query.cadence}
          options={[{ value: '', label: 'Any cadence' }, ...cadences.map(one => ({ value: one, label: one }))]}
          width={150}
        />
        <SelectFilter
          label="Sort"
          param="sort"
          value={query.sort}
          options={[
            { value: 'shelf', label: 'Board order' },
            { value: 'newest', label: 'Newest' },
            { value: 'title', label: 'By title' },
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
          challenges.total === totals.challenges
            ? `${number(totals.challenges)} challenge${totals.challenges === 1 ? '' : 's'}`
            : `${number(challenges.total)} of ${number(totals.challenges)} challenges`
        }
        subtitle={`Today is ${config.today} in ${config.timezone}`}
        action={<AddChallengeButton badges={badges.data} metrics={metrics} cadences={cadences} />}
        note="Every member is enrolled in every open challenge, so one added here is on every board at the next fetch. A completion keeps the goal it was judged against, which is why raising a goal is safe mid-period: it changes what today takes, not what yesterday paid."
        dense
      >
        <DataTable
          columns={[
            { label: 'Challenge' },
            { label: 'Asks for', align: 'right' },
            { label: 'Pays', align: 'right' },
            { label: 'Window' },
            { label: 'Finished', align: 'right' },
            { label: '', align: 'right', width: 190 },
          ]}
          rows={data.map(challenge => ({
            key: challenge.id,
            tone: challenge.badgeMissing || !challenge.active ? 'danger' : 'default',
            cells: [
              <Stack key="what" spacing={0.25}>
                <Typography variant="subtitle2">
                  {challenge.emoji} {challenge.title}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <Label color={TONE[challenge.state]} variant="soft">
                    {challenge.state}
                  </Label>
                  <Label color="default" variant="soft">
                    {challenge.cadence}
                  </Label>
                  {challenge.badgeMissing && (
                    <Label color="error" variant="soft">
                      badge missing
                    </Label>
                  )}
                </Stack>
                <Mono>{challenge.id}</Mono>
              </Stack>,
              <Stack key="goal" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2">{number(challenge.goal)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {UNITS[challenge.metric] ?? challenge.metric}
                </Typography>
              </Stack>,
              <Stack key="pays" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2">{coins(challenge.rewardCoins)} coins</Typography>
                {challenge.rewardsBadge && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    + {challenge.badgeLabel ?? challenge.badgeId}
                  </Typography>
                )}
              </Stack>,
              <Stack key="window" spacing={0.25}>
                <Typography variant="body2">
                  {challenge.startsOn ?? 'always'}
                  {challenge.endsOn ? ` → ${challenge.endsOn}` : ''}
                </Typography>
                {challenge.completions.lastAt && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    last finished {ago(challenge.completions.lastAt)}
                  </Typography>
                )}
              </Stack>,
              <Stack key="done" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{number(challenge.completions.total)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {number(challenge.completions.members)} member(s) · {coins(challenge.completions.granted)} paid
                  {challenge.completions.unpaid > 0 ? ` · ${number(challenge.completions.unpaid)} unpaid` : ''}
                </Typography>
              </Stack>,
              <ChallengeRowActions
                key="actions"
                challenge={challenge}
                badges={badges.data}
                metrics={metrics}
                cadences={cadences}
              />,
            ],
          }))}
          empty={query.q || query.state !== 'any' || query.cadence ? 'Nothing matches those filters.' : 'No challenges yet — add the first one.'}
        />
        <OffsetPager total={challenges.total} offset={challenges.offset} limit={challenges.limit} />
      </Panel>

      <Panel title="Why a completion might not have paid" subtitle="Before blaming the challenge">
        <Kv
          items={[
            {
              label: 'Badge coins',
              value: config.achievementCoinsEnabled ? 'on' : 'off — every badge payout is held',
              hint: '⚙ coins.achievements.enabled',
            },
            {
              label: 'Step coins',
              value: config.stepCoinsEnabled ? 'on' : 'off — step-derived rewards wait for it',
              hint: '⚙ coins.steps.enabled',
            },
            {
              // Found by query rather than filtered out of the rows above:
              // the list is a page now, and "none unpaid" read off one page
              // of it would be a different sentence from the truth.
              label: 'Unpaid right now',
              value:
                attention.unpaid.length === 0
                  ? 'none'
                  : attention.unpaid.map(entry => `${entry.title} (${number(entry.unpaid)})`).join(' · '),
              hint: 'capped by the daily ceiling, or waiting on a switch above',
            },
            {
              label: 'Badges that are not there',
              value:
                attention.badgeMissing.length === 0
                  ? 'none'
                  : attention.badgeMissing.map(entry => `${entry.title} → ${entry.badgeId}`).join(' · '),
              hint: 'the challenge pays a badge that has been deleted',
            },
            {
              label: 'The badge shelf',
              value: (
                <TextLink href={paths.dashboard.achievements}>{number(badges.total)} badge(s)</TextLink>
              ),
            },
          ]}
        />
      </Panel>
    </Stack>
  );
}
