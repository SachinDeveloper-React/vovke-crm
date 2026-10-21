import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ColumnChart, TimeSeries } from '@/src/components/charts';
import { Label } from '@/src/components/label';
import { DataTable, DaysFilter, FilterBar, Kv, Panel, Stat } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { coins, date as formatDate, decimal, number, percent } from '@/src/lib/format';
import type { ShadowReport } from '@/src/lib/types';

/**
 * What switching step coins on would cost (D-05, RULES E14).
 *
 * Steps are ingested and scored from the first release, and nothing is
 * minted. Turning minting on is not a code change — it is an answer to two
 * questions this page exists to answer from real days:
 *
 *   **Does verification pay out fairly?** The verified share is the number a
 *   member feels as "I walked 10,000 and got paid for 6,000". Much below the
 *   0.65 benchmark and the rate is wrong, or a layer is too harsh — and the
 *   time to find that out is before anybody has been paid, because a coin
 *   that has been minted cannot be taken back.
 *
 *   **What would it cost?** The coin figures are what today's rate and
 *   ceilings would have held, day by day.
 */
export async function EconomyView({ days }: { days: number }) {
  const report = await adminGet<ShadowReport>('/admin/activity/shadow', { days });
  const { rate, totals, byDay } = report;

  const benchmark = 0.65;
  const fair = totals.verifiedShare >= benchmark;

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Label color={rate.enabled ? 'success' : 'warning'} variant="soft">
            {rate.enabled ? 'step coins are being minted' : 'step coins are off — this is the shadow figure'}
          </Label>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {formatDate(report.from)} – {formatDate(report.to)}
          </Typography>
        </Stack>
        <FilterBar>
          <DaysFilter value={days} options={[7, 30, 60, 90]} />
        </FilterBar>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Verified share"
            value={percent(totals.verifiedShare)}
            icon="solar:verified-check-bold-duotone"
            delta={`${fair ? 'at or above' : 'below'} the 0.65 benchmark`}
            deltaDirection={fair ? 'up' : 'down'}
            hint={`${number(totals.verifiedSteps)} of ${number(totals.steps)} steps`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Coins it would have held"
            value={coins(totals.coins)}
            icon="solar:dollar-minimalistic-bold-duotone"
            hint={`${decimal(totals.coinsPerUserDay, 3)} per member-day — the run rate to budget from`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Days scored"
            value={number(totals.days)}
            icon="solar:calendar-bold-duotone"
            hint={`${number(totals.users)} accounts · ${number(totals.verifiedDays)} verified, ${number(totals.unverifiedDays)} refused`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Refused days"
            value={percent(totals.days > 0 ? totals.unverifiedDays / totals.days : 0)}
            icon="solar:close-circle-bold-duotone"
            goodDirection="down"
            hint="Those days show their steps but earn nothing and keep no streak"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Panel
            title="What each day would have cost"
            subtitle="At today's rate and ceilings"
            note="Every day is costed at the normal tier's step ceiling rather than each member's own, so an account on watch is costed slightly high. The per-source and daily coin caps are applied as the economy would apply them."
          >
            <ColumnChart
              data={byDay.map(day => ({ date: day.localDay, coins: day.coins }))}
              series={[{ key: 'coins', label: 'Coins held' }]}
              valueFormat="coins"
              height={260}
              ariaLabel="Coins per day the current rate would have held"
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Panel title="The knobs these figures used" note="Change them in the server's own config, not here.">
            <Kv
              items={[
                { label: 'Minting enabled', value: rate.enabled ? 'yes' : 'no' },
                { label: 'Rate', value: `${rate.coinsPerUnit} coins / ${number(rate.unitSteps)} steps` },
                { label: 'Per 1,000 steps', value: `${decimal(rate.per1000, 3)} coins` },
                { label: 'Step ceiling (normal)', value: number(rate.stepCap) },
                { label: 'Step source cap', value: `${number(rate.sourceCap)} coins/day` },
                { label: 'Daily cap', value: `${number(rate.dailyCap)} coins/day` },
              ]}
            />
          </Panel>
        </Grid>

        <Grid size={12}>
          <Panel
            title="Shown against verified, day by day"
            subtitle="The gap is what the layers would not accept"
          >
            <TimeSeries
              data={byDay.map(day => ({ date: day.localDay, steps: day.steps, verified: day.verifiedSteps }))}
              series={[
                { key: 'steps', label: 'Shown' },
                { key: 'verified', label: 'Verified' },
              ]}
              valueFormat="compact"
              height={260}
              ariaLabel="Steps shown and steps verified per day"
            />
          </Panel>
        </Grid>
      </Grid>

      <Panel title="Every day in the window" dense>
        <DataTable
          columns={[
            { label: 'Day' },
            { label: 'Accounts', align: 'right' },
            { label: 'Days', align: 'right' },
            { label: 'Shown', align: 'right' },
            { label: 'Verified', align: 'right' },
            { label: 'Share', align: 'right' },
            { label: 'Verified · refused', align: 'right' },
            { label: 'Coins', align: 'right' },
          ]}
          rows={[...byDay].reverse().map(day => ({
            key: day.localDay,
            cells: [
              formatDate(day.localDay),
              number(day.users),
              number(day.days),
              number(day.steps),
              number(day.verifiedSteps),
              percent(day.steps > 0 ? day.verifiedSteps / day.steps : 0, 0),
              `${number(day.verifiedDays)} · ${number(day.unverifiedDays)}`,
              coins(day.coins),
            ],
          }))}
          empty="No day has been scored in this window."
        />
      </Panel>

      <Box>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          The figures above are the shadow of a decision, not the decision: a coin once minted cannot be taken back, so
          the rate is judged on days already scored rather than on the first week of live minting.
        </Typography>
      </Box>
    </Stack>
  );
}
