import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { RankedBars } from '@/src/components/charts';
import { DataTable, DaysFilter, FilterBar, Mono, Panel, SeverityChip, Stat, TextLink } from '@/src/components/ui';
import { Label } from '@/src/components/label';
import { adminGet } from '@/src/lib/api';
import { ago, compact, dateTime, number, percent } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import { problemOf, SEVERITY_RANK } from '@/src/lib/problems';
import type { FleetReport } from '@/src/lib/types';

/**
 * The same questions the member read asks, asked of every install (RULES P18).
 *
 * This is the one that answers "what is the main problem", because the
 * per-member read can only ever say what is wrong for the member in front of
 * you. Read worst first: the list is the fix list.
 */
export async function DiagnoseView({ days }: { days: number }) {
  const fleet = await adminGet<FleetReport>('/admin/health/fleet', { days });
  const { installs, problems, byManufacturer, byAppVersion, topErrors } = fleet;

  const ranked = [...problems]
    .map(problem => ({ ...problem, ...problemOf(problem.code) }))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.installs - a.installs);

  const worst = ranked[0];
  const quietShare = installs.signedIn > 0 ? installs.quiet / installs.signedIn : 0;

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {worst
            ? `Worst right now: ${worst.title.toLowerCase()} — ${number(worst.installs)} installs.`
            : 'No install is reporting a problem.'}{' '}
          Fault counts are over the last {days} days.
        </Typography>
        <FilterBar>
          <DaysFilter value={days} options={[1, 7, 14, 30]} />
        </FilterBar>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Installs signed in"
            value={compact(installs.signedIn)}
            icon="solar:smartphone-2-bold-duotone"
            hint={`of ${number(installs.total)} not revoked`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Reporting steps"
            value={compact(installs.reportingSteps)}
            icon="solar:cloud-check-bold-duotone"
            hint={`${percent(installs.signedIn ? installs.reportingSteps / installs.signedIn : 0, 0)} of signed-in installs have ever uploaded`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Gone quiet"
            value={compact(installs.quiet)}
            icon="solar:cloud-cross-bold-duotone"
            goodDirection="down"
            hint={`${percent(quietShare, 0)} of signed-in installs — counting, not reporting`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Stale health reports"
            value={compact(installs.healthStale)}
            icon="solar:clock-circle-bold-duotone"
            goodDirection="down"
            hint={`${number(installs.reportingHealth)} reported recently`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel
            title="What is wrong, worst first"
            subtitle="How many installs each problem is true of"
            note="Severity is the same ranking the per-member read uses. A count of zero is left out rather than shown as solved."
          >
            <RankedBars
              items={ranked.map(problem => ({
                label: problem.title,
                value: problem.installs,
                tone: problem.severity === 'high' ? 'critical' : problem.severity === 'medium' ? 'warning' : 'accent',
              }))}
              emptyText="Nothing is wrong with any install right now."
            />
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Panel title="And what to do about each" dense>
            <Stack divider={<Box sx={{ borderBottom: '1px dashed', borderColor: 'divider' }} />}>
              {ranked.length === 0 && (
                <Typography variant="body2" sx={{ color: 'text.disabled', px: 3, py: 3 }}>
                  Nothing to fix. Every install that has said anything is working.
                </Typography>
              )}
              {ranked.map(problem => (
                <Box key={problem.code} sx={{ px: 3, py: 2 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
                    <SeverityChip severity={problem.severity} />
                    <Typography variant="subtitle2">{problem.title}</Typography>
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {number(problem.installs)}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {problem.meaning}
                  </Typography>
                  {problem.fix && (
                    <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.75 }}>
                      <Box component="span" sx={{ color: 'text.disabled' }}>
                        Fix ·{' '}
                      </Box>
                      {problem.fix}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    <Mono>{problem.code}</Mono>
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Panel>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel
            title="Where the dead counters are"
            subtitle="By the manufacturer the tracker itself reported"
            note="The OEM rules are judged on the tracker's own answer, which can differ from the registration's on a rebadged phone. The worst 20 manufacturers, which is every one that matters."
            dense
          >
            <DataTable
              columns={[
                { label: 'Manufacturer' },
                { label: 'Installs', align: 'right' },
                { label: 'Service dead', align: 'right' },
                { label: 'Battery free to kill', align: 'right' },
              ]}
              rows={byManufacturer.map(row => ({
                key: row.manufacturer,
                tone: row.serviceDead > 0 ? 'danger' : 'default',
                cells: [
                  <Typography key="oem" variant="subtitle2">
                    {row.manufacturer}
                  </Typography>,
                  number(row.installs),
                  <Stack key="dead" spacing={0.25} sx={{ alignItems: 'flex-end' }}>
                    <Typography variant="body2">{number(row.serviceDead)}</Typography>
                    {row.serviceDead > 0 && (
                      <Typography variant="caption" sx={{ color: 'error.main' }}>
                        {percent(row.serviceDead / row.installs, 0)}
                      </Typography>
                    )}
                  </Stack>,
                  number(row.batteryRestricted),
                ],
              }))}
              empty="No install has sent a health report yet."
            />
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel
            title="Which build is failing"
            subtitle="Active installs beside the faults they have hit"
            note="Fault groups are distinct faults, not occurrences: twenty members hitting one bug is one group."
            dense
          >
            <DataTable
              columns={[
                { label: 'Build' },
                { label: 'Installs', align: 'right' },
                { label: 'Fault groups', align: 'right' },
                { label: 'Crashes', align: 'right' },
                { label: 'Members hit', align: 'right' },
              ]}
              rows={byAppVersion.map(row => ({
                key: row.appVersion,
                tone: row.fatalGroups > 0 ? 'danger' : 'default',
                cells: [
                  <Typography key="v" variant="subtitle2">
                    {row.appVersion}
                  </Typography>,
                  number(row.installs),
                  number(row.errorGroups),
                  row.fatalGroups > 0 ? (
                    <Label key="fatal" color="error" variant="soft">
                      {number(row.fatalGroups)}
                    </Label>
                  ) : (
                    '—'
                  ),
                  number(row.affectedUsers),
                ],
              }))}
              empty="No install has registered a build."
            />
          </Panel>
        </Grid>
      </Grid>

      <Panel
        title="The faults themselves"
        subtitle={`Grouped by fingerprint, crashes first — ${number(topErrors.length)} shown`}
        note="A fault twenty people hit matters more than one somebody hit twenty times, which is the order here — the API returns the worst 25, so this list is the fix list rather than the whole book. The symbolicated stack for the same fingerprint is in Crashlytics."
        dense
      >
        <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
          {topErrors.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.disabled', px: 3, py: 3 }}>
              No fault has been reported in this window.
            </Typography>
          )}
          {topErrors.map(error => (
            <Box key={error.fingerprint} sx={{ px: 3, py: 2 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                {error.fatal ? (
                  <Label color="error" variant="soft">
                    crash
                  </Label>
                ) : (
                  <Label color="warning" variant="soft">
                    handled
                  </Label>
                )}
                <Typography variant="subtitle2">{error.name ?? error.kind}</Typography>
                {error.screen && (
                  <Label color="default" variant="soft">
                    {error.screen}
                  </Label>
                )}
                {error.scope && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    in {error.scope}
                  </Typography>
                )}
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {number(error.users)} members · {number(error.occurrences)} times · last {ago(error.lastAt)}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'var(--font-geist-mono)', fontSize: 12.5 }}>
                {error.message}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                {error.appVersions.map(version => (
                  <Label key={version} color="default" variant="soft">
                    {version}
                  </Label>
                ))}
                <Typography variant="caption" sx={{ color: 'text.disabled', alignSelf: 'center' }}>
                  <Mono>{error.fingerprint}</Mono> · {dateTime(error.lastAt)}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Panel>

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        A fault on one account reads better on that account:{' '}
        <TextLink href={paths.dashboard.users.root}>find the member</TextLink>{' '}
        and open their diagnosis, which names the phone and says what to tell them.
      </Typography>
    </Stack>
  );
}
