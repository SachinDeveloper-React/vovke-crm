import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  DataTable,
  FilterBar,
  Mono,
  Panel,
  SelectFilter,
  Stat,
  TextLink,
} from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, coins, date, number, shortId } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { AdminLeaderboard } from '@/src/lib/types';

import { LadderForm, ScoringForm, WordsForm } from './board-forms';

export type LeaderboardQuery = { country: string };

/**
 * The weekly board: what it pays, who is standing in the paid places, and
 * every word the app says about it (RULES §L, D-89).
 *
 * The prizes were always the config's. The sentences around them were the
 * app's and the server's code — which meant the one page in Vokve that
 * promises people money could only be reworded by a release. Both are config
 * now, and this is where they are written.
 *
 * Three things on this page exist because a prize ladder is edited while
 * real people are standing on it:
 *
 *   - **the preview** is the server's own filling of the copy, not this
 *     page's guess at it. The words carry placeholders — `{prizes}`,
 *     `{scope}` — and a second implementation of that filling would be a
 *     page that disagreed with the app about what it says.
 *   - **the live standings**, with what each place would take if the week
 *     closed now. "Places 4–10 take 1,000" is a different decision when
 *     seven people are in them.
 *   - **whether it would pay at all.** Prizes are step-derived, so they wait
 *     on ⚙ `coins.steps.enabled` (D-46): a board can look perfect and credit
 *     nobody, which is the kind of thing to find out here rather than on a
 *     Monday.
 */
export async function LeaderboardView({ query }: { query: LeaderboardQuery }) {
  const board = await adminGet<AdminLeaderboard>('/admin/leaderboard', {
    country: query.country || undefined,
    limit: 25,
  });
  const { config, preview, period, totals, standings, lastClosed } = board;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="A full week costs"
            value={coins(totals.coinsPerWeek)}
            icon="solar:wallet-money-bold-duotone"
            goodDirection="none"
            hint={`${number(totals.lastPaidRank)} paid place(s), ${number(config.tiers.length)} rung(s)`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Scoring this week"
            value={number(totals.ranked)}
            icon="solar:chart-2-bold-duotone"
            goodDirection="up"
            hint={`${number(totals.paidPlacesFilled)} of the paid places filled`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Week ends"
            value={date(period.end)}
            icon="solar:calendar-bold-duotone"
            goodDirection="none"
            hint={`closes ${number(period.closeAfterHours)}h into Monday, ${board.zone}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Prizes pay out"
            value={board.payable ? 'Yes' : 'Held'}
            icon={board.payable ? 'solar:check-circle-bold-duotone' : 'solar:pause-circle-bold-duotone'}
            goodDirection={board.payable ? 'up' : 'down'}
            hint={board.payable ? 'coins are credited at close' : '⚙ coins.steps.enabled is off'}
          />
        </Grid>
      </Grid>

      {!board.payable && (
        <Panel title="Nothing is being credited" subtitle="The board still closes and the places are still frozen">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Leaderboard prizes are step-derived, so they wait on ⚙ <Mono>coins.steps.enabled</Mono> like every other
            step reward. A week that closes while it is off is recorded with what it <i>would</i> have paid, and the
            member is told their place either way — but no coins move. Switch it on from{' '}
            <TextLink href={{ pathname: paths.dashboard.config }}>App config</TextLink> when the pipeline is trusted.
          </Typography>
        </Panel>
      )}

      <FilterBar>
        <SelectFilter
          label="Board"
          param="country"
          value={query.country}
          options={board.countries.map(country => ({ value: country, label: country }))}
          width={140}
        />
      </FilterBar>

      <Panel
        title="What the app says"
        subtitle={`The reward screen for ${board.scope}, exactly as it will arrive`}
        note="The server fills the placeholders in per reader, so this is its own filling of them — not this page's guess at it."
      >
        <Stack spacing={2}>
          <Stack spacing={0.25}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {preview.banner?.kicker ?? '—'}
            </Typography>
            <Typography variant="h5">{preview.banner?.title ?? '—'}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {preview.banner?.subtitle ?? '—'}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {preview.tiers.map(tier => (
              <Stack
                key={tier.id}
                spacing={0.25}
                sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', minWidth: 180 }}
              >
                <Typography variant="subtitle2">{tier.label}</Typography>
                <Typography variant="h6">{coins(tier.coins)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {tier.perks.length > 0 ? tier.perks.join(' + ') : 'no gear'}
                </Typography>
                <Mono>
                  place {tier.fromRank}
                  {tier.toRank === tier.fromRank ? '' : `–${tier.toRank}`}
                </Mono>
              </Stack>
            ))}
          </Stack>

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {preview.note}
          </Typography>

          <Stack component="ol" spacing={0.75} sx={{ m: 0, pl: 3 }}>
            {preview.howItWorks.map(step => (
              <Typography key={step.title} component="li" variant="body2">
                <b>{step.title}</b> — {step.detail}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Panel>

      <Panel
        title="The prize ladder"
        subtitle="What each place pays, and what the app calls it"
        note="Coins here are exempt from the daily earning ceiling (RULES E8d): a weekly prize is a period reward, not daily earning."
      >
        <LadderForm config={config} />
      </Panel>

      <Panel
        title={`This week · ${period.id}`}
        subtitle={`${number(totals.ranked)} scoring in ${board.scope}, top ${number(standings.length)} shown`}
        note="What each place would take if the week closed as it stands. Nothing here is paid until the close."
        dense
      >
        <DataTable
          columns={[
            { label: '#', width: 60 },
            { label: 'Member' },
            { label: 'Score' },
            { label: 'From' },
            { label: 'Would take' },
          ]}
          rows={standings.map(row => ({
            key: row.userId,
            cells: [
              <Typography key="rank" variant="subtitle2">
                {row.rank}
              </Typography>,
              <Stack key="who" spacing={0.25}>
                <TextLink href={{ pathname: paths.dashboard.users.detail(row.userId) }}>{row.name}</TextLink>
                <Mono>{shortId(row.userId, 8)}</Mono>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  the app shows “{row.publicName}”
                </Typography>
              </Stack>,
              <Typography key="score" variant="subtitle2">
                {number(row.score)}
              </Typography>,
              <Typography key="from" variant="caption" sx={{ color: 'text.secondary' }}>
                {number(row.steps)} steps · {number(row.workouts)} workout(s) · {number(row.challenges)} challenge(s)
              </Typography>,
              <Stack key="prize" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {row.coins > 0 ? (
                  <Label color="success" variant="soft">
                    {coins(row.coins)}
                  </Label>
                ) : (
                  <Label color="default" variant="soft">
                    nothing
                  </Label>
                )}
                {row.perks.map(perk => (
                  <Label key={perk} color="info" variant="soft">
                    {perk}
                  </Label>
                ))}
              </Stack>,
            ],
          }))}
          empty="Nobody has scored this week yet."
        />
      </Panel>

      <Panel
        title="The words"
        subtitle="The banner, the note and the How it works tab"
        note="Members read a change on their next refresh — the screen asks for these every time it opens."
      >
        <WordsForm config={config} />
      </Panel>

      <Panel title="Scoring and the week" subtitle="What a point is worth, and when the week is paid">
        <ScoringForm config={config} />
      </Panel>

      {lastClosed && (
        <Panel
          title={`Last week · ${lastClosed.id}`}
          subtitle={`${number(lastClosed.ranked)} ranked, closed ${ago(lastClosed.closedAt)}`}
          note={
            lastClosed.coinsOwed > 0
              ? `${coins(lastClosed.coinsOwed)} was owed by the ladder and not credited — the step-rewards switch was off at close.`
              : undefined
          }
          dense
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Label color="success" variant="soft">
                {coins(lastClosed.coinsPaid)} paid
              </Label>
              {lastClosed.coinsOwed > 0 && (
                <Label color="warning" variant="soft">
                  {coins(lastClosed.coinsOwed)} held
                </Label>
              )}
              {lastClosed.excluded > 0 && (
                <Label color="error" variant="soft">
                  {number(lastClosed.excluded)} place(s) skipped for a fraud flag
                </Label>
              )}
            </Stack>

            <DataTable
              columns={[
                { label: '#', width: 60 },
                { label: 'Member' },
                { label: 'Score' },
                { label: 'Won' },
                { label: 'Paid' },
              ]}
              rows={lastClosed.winners.map(row => ({
                key: `${row.rank}-${row.userId}`,
                tone: row.excluded ? 'danger' : 'default',
                cells: [
                  <Typography key="rank" variant="subtitle2">
                    {row.rank}
                  </Typography>,
                  <Stack key="who" spacing={0.25}>
                    <TextLink href={{ pathname: paths.dashboard.users.detail(row.userId) }}>
                      {row.name}
                    </TextLink>
                    <Mono>{shortId(row.userId, 8)}</Mono>
                  </Stack>,
                  <Typography key="score" variant="subtitle2">
                    {number(row.score)}
                  </Typography>,
                  <Stack key="won" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    <Label color="default" variant="soft">
                      {coins(row.coins)}
                    </Label>
                    {row.perks.map(perk => (
                      <Label key={perk} color="info" variant="soft">
                        {perk}
                      </Label>
                    ))}
                  </Stack>,
                  row.excluded ? (
                    <Label key="paid" color="error" variant="soft">
                      skipped — open fraud flag
                    </Label>
                  ) : row.paid ? (
                    <Label key="paid" color="success" variant="soft">
                      {coins(row.granted)}
                    </Label>
                  ) : (
                    <Label key="paid" color="warning" variant="soft">
                      not credited
                    </Label>
                  ),
                ],
              }))}
              empty="Nobody won anything last week."
            />
          </Stack>
        </Panel>
      )}
    </Stack>
  );
}
