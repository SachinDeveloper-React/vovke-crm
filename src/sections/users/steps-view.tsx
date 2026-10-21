import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ColumnChart } from '@/src/components/charts';
import { Label } from '@/src/components/label';
import { DataTable, DaysFilter, FilterBar, Panel, Stat } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { date as formatDate, humanise, number, percent } from '@/src/lib/format';
import type { MemberSteps } from '@/src/lib/types';

/**
 * What this member has walked, day by day (RULES A3, A20).
 *
 * The question support is asked most often — "my steps are missing" — and the
 * answer is almost always on one row: the day is there but unverified, or the
 * day shows its steps and credited none of them. So each day carries what
 * judged it beside what it counted, and the goal it is measured against is
 * the one the member actually set rather than the default.
 */
export async function MemberStepsView({ userId, days }: { userId: string; days: number }) {
  const report = await adminGet<MemberSteps>(`/admin/users/${encodeURIComponent(userId)}/steps`, { days });
  const { window, goal, totals, streak, byDay, data } = report;

  const chart = byDay.map(day => ({
    date: day.localDay,
    verified: day.verifiedSteps,
    unverified: Math.max(0, day.steps - day.verifiedSteps),
  }));

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {formatDate(window.from)} – {formatDate(window.to)} · {number(window.days)} day
          {window.days === 1 ? '' : 's'} with a row, in {window.timezone}
        </Typography>
        <FilterBar>
          <DaysFilter value={days} options={[7, 30, 90, 365]} />
        </FilterBar>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Steps walked"
            value={number(totals.steps)}
            icon="solar:walking-bold-duotone"
            hint={`${number(totals.averageSteps)} a day · best ${number(totals.bestDay?.steps ?? 0)}`}
            trend={byDay.map(day => day.steps)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Verified"
            value={percent(totals.verifiedShare)}
            icon="solar:verified-check-bold-duotone"
            hint={`${number(totals.verifiedSteps)} steps · ${number(totals.unverifiedDays)} day(s) refused`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Days at goal"
            value={`${number(totals.goalDays)}/${number(window.days)}`}
            icon="solar:target-bold-duotone"
            hint={`their goal is ${number(goal)} steps`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Streak"
            value={number(streak?.current ?? 0)}
            icon="solar:fire-bold-duotone"
            hint={`longest ${number(streak?.longest ?? 0)} · ${number(totals.workouts)} workout(s) here`}
          />
        </Grid>
      </Grid>

      <Panel
        title="Steps a day, verified and not"
        subtitle={`${number(totals.verifiedSteps)} of ${number(totals.steps)} verified · ${number(totals.distanceKm)} km · ${number(totals.activeMinutes)} active minutes · ${number(totals.calories)} kcal`}
        note="A day the layers refused shows its steps and earns nothing — the gap between the two bars is what was not accepted."
      >
        <ColumnChart
          data={chart}
          series={[
            { key: 'verified', label: 'Verified' },
            { key: 'unverified', label: 'Not verified' },
          ]}
          valueFormat="compact"
          height={260}
          ariaLabel="Steps per day, verified and unverified"
        />
      </Panel>

      <Panel
        title="Day by day"
        subtitle="Newest first, with what judged each one"
        note="`Credited` is the high-water mark: steps already paid or held for that day, which is why re-scoring a day never pays twice. Layer scores are 0–100 as they were when the day was scored."
        dense
      >
        <DataTable
          columns={[
            { label: 'Day' },
            { label: 'Steps', align: 'right' },
            { label: 'Verified', align: 'right' },
            { label: 'Credited', align: 'right' },
            { label: 'Distance · minutes', align: 'right' },
            { label: 'Source' },
            { label: 'Judged' },
          ]}
          rows={data.map(day => ({
            key: day.localDay,
            tone: day.verified ? 'default' : 'danger',
            cells: [
              <Stack key="day" spacing={0.25}>
                <Typography variant="subtitle2">{formatDate(day.localDay)}</Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <Label color={day.verified ? 'success' : 'error'} variant="soft">
                    {day.verified ? 'verified' : 'refused'}
                  </Label>
                  {day.goalHit && (
                    <Label color="info" variant="soft">
                      goal
                    </Label>
                  )}
                </Stack>
              </Stack>,
              <Typography key="steps" variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {number(day.steps)}
              </Typography>,
              <Stack key="verified" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{number(day.verifiedSteps)}</Typography>
                {day.pedometerSteps !== null && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    phone counted {number(day.pedometerSteps)}
                  </Typography>
                )}
              </Stack>,
              <Typography key="credited" variant="body2" sx={{ textAlign: 'right' }}>
                {number(day.stepsCredited)}
              </Typography>,
              <Stack key="distance" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{day.distanceKm} km</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {number(day.activeMinutes)} min · {number(day.calories)} kcal
                </Typography>
              </Stack>,
              <Stack key="source" spacing={0.25}>
                <Typography variant="body2">{day.source ? humanise(day.source) : '—'}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {number(day.deviceCount)} phone(s)
                </Typography>
              </Stack>,
              <Stack key="judged" spacing={0.5} sx={{ maxWidth: 260 }}>
                {day.plausibility !== null && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    plausibility {number(day.plausibility)}/100
                  </Typography>
                )}
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {day.hardRejects.map(reject => (
                    <Label key={reject} color="error" variant="soft">
                      {humanise(reject)}
                    </Label>
                  ))}
                  {day.flags
                    .filter(flag => !day.hardRejects.includes(flag))
                    .map(flag => (
                      <Label key={flag} color="warning" variant="soft">
                        {humanise(flag)}
                      </Label>
                    ))}
                  {day.hardRejects.length === 0 && day.flags.length === 0 && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      nothing raised
                    </Typography>
                  )}
                </Stack>
              </Stack>,
            ],
          }))}
          empty="No day has been scored for this member in this window — either nothing has been sent, or nothing has been walked."
        />
      </Panel>

      <Box>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Days are keyed by the member’s own local day and never recomputed: a goal changed today does not rewrite last
          month’s calendar. To run the layers again over a day’s stored evidence, use the fraud case file.
        </Typography>
      </Box>
    </Stack>
  );
}
