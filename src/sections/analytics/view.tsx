import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ColumnChart, RankedBars, TimeSeries } from '@/src/components/charts';
import { ApiErrorNotice, DataTable, Kv, Panel, RowLink, Stat, TextLink, TrustChip } from '@/src/components/ui';
import { adminGet, adminTry } from '@/src/lib/api';
import { ago, coins, compact, date, dateTime, delta, humanise, number, percent, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { AnalyticsOverview, SignupRow } from '@/src/lib/types';

import { AnalyticsFilters } from './filters';

/**
 * The dashboard's own page: what grew, who used it, what they walked, and
 * what it cost.
 *
 * Read from one endpoint (`/admin/analytics/overview`) so every figure on it
 * was taken at the same instant. A page that loaded eight endpoints would
 * show eight clocks, and the first thing anyone does with two of those is
 * wonder which is right.
 */
export async function AnalyticsView({ days }: { days: number }) {
  const [overview, signups] = await Promise.all([
    adminGet<AnalyticsOverview>('/admin/analytics/overview', { days }),
    adminTry<{ data: SignupRow[] }>('/admin/analytics/signups', { limit: 8 }),
  ]);

  const { window, members, installs, engagement, activity, economy, integrity } = overview;
  const newMembers = delta(members.new, members.newPrevious);

  // Shown steps against verified steps, which is the gap a member feels as
  // "I walked 10,000 and got paid for 6,000" (RULES A20).
  const stepsByDay = activity.byDay.map(day => ({
    date: String(day.date),
    verified: Number(day.verifiedSteps ?? 0),
    unverified: Math.max(0, Number(day.steps ?? 0) - Number(day.verifiedSteps ?? 0)),
  }));

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {date(window.from)} – {date(window.to)} · days bucketed in {window.timezone} · read {ago(window.generatedAt)}
        </Typography>
        <AnalyticsFilters days={days} />
      </Stack>

      {/* ── Who is here ──────────────────────────────────────────────── */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Members"
            value={compact(members.total)}
            icon="solar:users-group-rounded-bold-duotone"
            delta={newMembers.label}
            deltaDirection={newMembers.direction}
            hint={`${number(members.new)} new in ${window.days}d`}
            trend={members.signupsByDay.map(day => Number(day.members ?? 0))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Active today"
            value={compact(engagement.dau)}
            icon="solar:pulse-bold-duotone"
            hint={`${compact(engagement.wau)} this week · ${compact(engagement.mau)} this month`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Verified share of steps"
            value={percent(activity.verifiedShare)}
            icon="solar:verified-check-bold-duotone"
            hint="Sweatcoin's published figure is about 65%"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Money taken"
            value={rupees(economy.orders.revenue, true)}
            icon="solar:wallet-bold-duotone"
            hint={`${number(economy.orders.count)} orders · ${rupees(economy.orders.aov, true)} average`}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Installs signed in"
            value={compact(installs.signedIn)}
            icon="solar:smartphone-2-bold-duotone"
            hint={`of ${number(installs.active)} active · steps only count while signed in`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Steps walked"
            value={compact(activity.steps)}
            icon="solar:walking-bold-duotone"
            hint={`${compact(activity.avgStepsPerMemberDay)} per member-day · ${number(activity.days)} days scored`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Coins credited"
            value={coins(economy.coins.earned)}
            icon="solar:dollar-minimalistic-bold-duotone"
            hint={`${coins(economy.coins.balance)} held in balances · ${coins(economy.coins.held)} in escrow`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Flags raised"
            value={compact(integrity.raised)}
            icon="solar:shield-warning-bold-duotone"
            hint={`${number(integrity.open)} still open · ${number(integrity.members)} accounts`}
            goodDirection="down"
          />
        </Grid>
      </Grid>

      {/* ── Growth and use ───────────────────────────────────────────── */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel
            title="New members a day"
            subtitle={`${number(members.new)} in this window, against ${number(members.newPrevious)} in the one before`}
            note="Sign-ups, by the day the account was created."
          >
            <ColumnChart
              data={members.signupsByDay}
              series={[{ key: 'members', label: 'Sign-ups' }]}
              valueFormat="number"
              ariaLabel="New members a day"
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel
            title="Members the trail saw"
            subtitle={`${number(engagement.trailMembers)} accounts · ${number(engagement.sessions)} visits · ${number(engagement.events)} events`}
            note="From the event trail, which an account can switch off (RULES P7) — the active counts in the tiles above come from the device heartbeat instead, which every account writes."
          >
            <TimeSeries
              data={engagement.byDay}
              series={[{ key: 'members', label: 'Members' }]}
              valueFormat="number"
              ariaLabel="Members seen in the trail per day"
            />
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Panel
            title="Steps a day, verified and not"
            subtitle={`${compact(activity.verifiedSteps)} of ${compact(activity.steps)} verified · ${number(activity.unverifiedDays)} days refused`}
            note="A day the layers refused shows its steps but earns nothing and keeps no streak."
          >
            <ColumnChart
              data={stepsByDay}
              series={[
                { key: 'verified', label: 'Verified' },
                { key: 'unverified', label: 'Not verified' },
              ]}
              valueFormat="compact"
              height={260}
              ariaLabel="Steps per day, verified and unverified"
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel
            title="Coins in and out"
            subtitle={`${coins(economy.coins.earned)} credited · ${coins(economy.coins.spent)} spent`}
            note="The ledger's own rows (RULES E2): credits above the line, spends below it, both in coins."
          >
            <TimeSeries
              data={economy.coins.byDay}
              series={[
                { key: 'earned', label: 'Credited' },
                { key: 'spent', label: 'Spent' },
              ]}
              valueFormat="coins"
              height={260}
              ariaLabel="Coins credited and spent per day"
            />
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Panel
            title="Money a day"
            subtitle={`${rupees(economy.orders.revenue, true)} over ${number(economy.orders.count)} orders`}
            note="What was payable in money, as the orders were placed (RULES R11). The coins half of each order is in the coin figures."
          >
            <ColumnChart
              data={economy.orders.byDay}
              series={[{ key: 'revenue', label: 'Payable' }]}
              valueFormat="rupees"
              ariaLabel="Money taken per day"
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel title="Where the coins came from" note="Credits and spends by source, over the window.">
            <RankedBars
              valueFormat="coins"
              items={economy.coins.bySource.map(source => ({
                label: humanise(source.source),
                value: Math.abs(source.coins),
                hint: `${number(source.rows)} rows`,
                tone: source.coins < 0 ? 'alt' : 'accent',
              }))}
              emptyText="No coin has moved in this window."
            />
          </Panel>
        </Grid>
      </Grid>

      {/* ── Where they go, and what they do ──────────────────────────── */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Panel title="Screens they open" note="Screen views in the window, most-visited first.">
            <RankedBars
              items={engagement.topScreens.slice(0, 8).map(screen => ({
                label: screen.screen,
                value: screen.views,
                hint: `${number(screen.members)} members`,
              }))}
              emptyText="No screen view has been reported."
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Panel title="What they do there" note="Every event that is not a screen view.">
            <RankedBars
              items={engagement.topActions.slice(0, 8).map(action => ({
                label: humanise(action.name),
                value: action.count,
                hint: `${number(action.members)} members`,
              }))}
              emptyText="No action has been reported."
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Panel title="What they are running" note="Active installs by the build they last registered with.">
            <RankedBars
              items={installs.byAppVersion.slice(0, 8).map(version => ({
                label: version.appVersion,
                value: version.installs,
              }))}
              emptyText="No install has registered a build."
            />
          </Panel>
        </Grid>
      </Grid>

      {/* ── The standing position ────────────────────────────────────── */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Panel title="Accounts" note="Everything ever created, whatever the window.">
            <Kv
              items={[
                { label: 'Total', value: number(members.total) },
                { label: 'Not deleted', value: number(members.live) },
                { label: 'Email verified', value: `${number(members.emailVerified)} · ${percent(members.total ? members.emailVerified / members.total : 0, 0)}` },
                { label: 'Phone verified', value: `${number(members.phoneVerified)} · ${percent(members.total ? members.phoneVerified / members.total : 0, 0)}` },
                { label: 'Profile completed', value: number(members.profileCompleted) },
                { label: 'Frozen', value: number(members.frozen) },
                { label: 'Deletion scheduled', value: number(members.deletionScheduled) },
              ]}
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Panel title="Trust tiers" note="The tier decides the escrow window and the step ceiling.">
            <RankedBars
              items={members.byTrustTier.map(tier => ({
                label: humanise(tier.tier),
                value: tier.members,
                tone: tier.tier === 'restricted' ? 'critical' : tier.tier === 'watch' ? 'warning' : 'accent',
              }))}
            />
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Installs by platform
              </Typography>
              <RankedBars
                items={installs.byPlatform.map(platform => ({
                  label: platform.platform === 'ios' ? 'iOS' : 'Android',
                  value: platform.installs,
                  hint: `${number(platform.signedIn)} signed in`,
                }))}
              />
            </Box>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Panel
            title="What the layers found"
            subtitle={`${number(integrity.raised)} flags on ${number(integrity.members)} accounts`}
            note="Flags raised in this window, by what they were raised for."
            action={
              <TextLink href={paths.dashboard.fraud.root} variant="caption">
                Review queue →
              </TextLink>
            }
          >
            <Kv
              items={[
                { label: 'Open', value: number(integrity.open) },
                { label: 'Confirmed', value: number(integrity.confirmed) },
                { label: 'Dismissed', value: number(integrity.dismissed) },
                { label: 'Hard · soft', value: `${number(integrity.hard)} · ${number(integrity.soft)}` },
              ]}
            />
            <Box sx={{ mt: 2 }}>
              <RankedBars
                items={integrity.byKind.slice(0, 6).map(kind => ({
                  label: humanise(kind.kind),
                  value: kind.flags,
                  hint: `${number(kind.members)} members`,
                  tone: 'warning',
                }))}
                emptyText="No flag in this window."
              />
            </Box>
          </Panel>
        </Grid>
      </Grid>

      {/* ── Who just arrived ─────────────────────────────────────────── */}
      <Panel title="Newest accounts" dense>
        {'error' in signups ? (
          <Box sx={{ px: 3, pb: 2 }}>
            <ApiErrorNotice error={signups.error} what="The arrivals strip" />
          </Box>
        ) : (
          <DataTable
            columns={[
              { label: 'Member' },
              { label: 'Phone' },
              { label: 'Country' },
              { label: 'Trust' },
              { label: 'Signed up', align: 'right' },
            ]}
            rows={signups.data.data.map(row => ({
              key: row.id,
              cells: [
                <RowLink key="who" href={paths.dashboard.users.detail(row.id)} secondary={row.email}>
                  {row.name || 'No name yet'}
                </RowLink>,
                row.phone,
                row.country ?? '—',
                <TrustChip key="trust" tier={row.trust.tier} score={row.trust.score} />,
                <Stack key="at" spacing={0.25} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{ago(row.signedUpAt)}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {dateTime(row.signedUpAt)}
                  </Typography>
                </Stack>,
              ],
            }))}
            empty="Nobody has signed up yet."
          />
        )}
      </Panel>
    </Stack>
  );
}
