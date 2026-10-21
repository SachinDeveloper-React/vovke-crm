import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ColumnChart } from '@/src/components/charts';
import { Label } from '@/src/components/label';
import { DataTable, DaysFilter, FilterBar, Kv, Panel, Stat, TextLink } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { paths } from '@/src/layout/paths';
import { ago, date as formatDate, dateTime, humanise, number, percent } from '@/src/lib/format';
import type { MemberSteps } from '@/src/lib/types';

import { SourceChips, SourceName, statusOf } from './step-sources';

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
  const { window, goal, totals, streak, bySource, last, byDay, data } = report;

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

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Panel
            title="Where the steps came from"
            subtitle="Every source any of their phones saw in this window"
            note="A day's figure is credited to the one source that answered for it — the scoring never splits a day between two — and `wrote` is everything that source recorded, the days it was not believed included. A watch that recorded every day and was believed on three reads as 3 answered of 20."
            dense
          >
            <DataTable
              columns={[
                { label: 'Source' },
                { label: 'Steps it answered for', align: 'right' },
                { label: 'Days answered', align: 'right' },
                { label: 'What it wrote', align: 'right' },
                { label: 'Last seen' },
              ]}
              rows={bySource.map(source => ({
                key: source.key,
                cells: [
                  <SourceName key="who" source={source} />,
                  <Stack key="steps" spacing={0.25} sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {number(source.steps)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {number(source.verifiedSteps)} verified
                    </Typography>
                  </Stack>,
                  <Typography key="days" variant="body2" sx={{ textAlign: 'right' }}>
                    {number(source.daysAnswered)} of {number(source.days)}
                  </Typography>,
                  <Typography key="wrote" variant="body2" sx={{ textAlign: 'right' }}>
                    {number(source.wrote)}
                  </Typography>,
                  <Stack key="last" spacing={0.5}>
                    <Typography variant="body2">{source.lastDay ? formatDate(source.lastDay) : '—'}</Typography>
                    <Label color={statusOf(source.lastStatus).tone} variant="soft">
                      {statusOf(source.lastStatus).label}
                    </Label>
                  </Stack>,
                ],
              }))}
              empty="No day in this window was scored with a source behind it — either nothing has been synced, or these days were written before sources were kept."
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel
            title="The last steps, and what they came from"
            subtitle={last ? `${formatDate(last.localDay)} · their newest day with steps on it` : undefined}
            note="Synced is when the phone last sent that day, which is not when it was walked: a day can arrive hours or days late."
          >
            {last === null ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', px: 3, py: 2 }}>
                No day in this window carries a step.
              </Typography>
            ) : (
              <Stack spacing={1.5} sx={{ px: 3, py: 2 }}>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  <Typography variant="h6">{last.app ? last.app.appName : 'Not recorded'}</Typography>
                  {last.app && <SourceChips source={last.app} />}
                  <Label color={last.verified ? 'success' : 'error'} variant="soft">
                    {last.verified ? 'verified' : 'refused'}
                  </Label>
                  {last.phonesAdded && (
                    <Label color="secondary" variant="soft">
                      phones added together
                    </Label>
                  )}
                </Stack>
                <Kv
                  columns={2}
                  items={[
                    { label: 'Steps', value: `${number(last.steps)} · ${number(last.verifiedSteps)} verified` },
                    { label: 'Read from', value: last.source ? humanise(last.source) : '—' },
                    { label: 'Phone', value: last.deviceName ?? '—' },
                    { label: 'App version', value: last.appVersion ?? '—' },
                    {
                      label: 'Synced',
                      value: last.syncedAt ? `${dateTime(last.syncedAt)} · ${ago(last.syncedAt)}` : 'no upload kept',
                    },
                    { label: 'Scored', value: last.scoredAt ? ago(last.scoredAt) : 'never scored' },
                  ]}
                />
                {last.app === null && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    This day was written without a source behind it — a day scored before sources were kept, or one
                    written by hand.
                  </Typography>
                )}
              </Stack>
            )}
          </Panel>
        </Grid>
      </Grid>

      <Panel
        title="Day by day"
        subtitle="Newest first, with the source it came from and what judged it — a day's date opens its own hours"
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
            { label: 'Step source' },
            { label: 'Judged' },
          ]}
          rows={data.map(day => ({
            key: day.localDay,
            tone: day.verified ? 'default' : 'danger',
            cells: [
              <Stack key="day" spacing={0.25}>
                <TextLink href={`${paths.dashboard.users.timeline(userId)}?date=${day.localDay}`} variant="subtitle2">
                  {formatDate(day.localDay)}
                </TextLink>
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
              <Stack key="source" spacing={0.5} sx={{ maxWidth: 240 }}>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  <Typography variant="body2">{day.sourceApp ? day.sourceApp.appName : '—'}</Typography>
                  {day.sourceApp && <SourceChips source={day.sourceApp} />}
                  {day.phonesAdded && (
                    <Label color="secondary" variant="soft">
                      phones added
                    </Label>
                  )}
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {day.source ? humanise(day.source) : 'not scored'} · {number(day.deviceCount)} phone(s)
                </Typography>
                {day.sources.filter(source => !source.answered && source.key !== 'phone').length > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {day.sources
                      .filter(source => !source.answered && source.key !== 'phone')
                      .map(source => `${source.appName} ${number(source.steps)} (${statusOf(source.status).label})`)
                      .join(' · ')}
                  </Typography>
                )}
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
