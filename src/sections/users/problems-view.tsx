import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Evidence, Mono, Panel, SeverityChip, Stat } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, number } from '@/src/lib/format';
import type { ProblemReport } from '@/src/lib/types';

/**
 * The diagnosis, in words (RULES P18).
 *
 * Everything here could be had from the five reads in the other tabs — this
 * is the one that asks them in the right order, so nobody has to know what
 * that order is. Two things make it worth trusting: nothing is inferred that
 * is not evidenced, and silence is a finding too.
 */
export async function MemberProblems({ userId }: { userId: string }) {
  const report = await adminGet<ProblemReport>(`/admin/users/${encodeURIComponent(userId)}/problems`);
  const { summary, findings } = report;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat label="High" value={number(summary.high)} goodDirection="down" icon="solar:danger-triangle-bold-duotone" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat label="Medium" value={number(summary.medium)} goodDirection="down" icon="solar:info-circle-bold-duotone" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat label="Low" value={number(summary.low)} goodDirection="down" icon="solar:minus-circle-bold-duotone" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat
            label="Installs signed in"
            value={`${number(summary.signedIn)}/${number(summary.installs)}`}
            icon="solar:smartphone-2-bold-duotone"
            hint="Steps only count while signed in"
          />
        </Grid>
      </Grid>

      {findings.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">Nothing is wrong</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Every install on this account that has said anything is working, is reporting steps, and is reachable.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {findings.map((finding, index) => (
            <Panel key={`${finding.code}-${finding.deviceId ?? index}`}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <SeverityChip severity={finding.severity} />
                  <Typography variant="subtitle1">{finding.title}</Typography>
                  <Box sx={{ flex: 1 }} />
                  {finding.since && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      since {ago(finding.since)}
                    </Typography>
                  )}
                </Stack>

                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {finding.detail}
                </Typography>

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'var(--mui-palette-background-neutral)',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <Typography variant="body2">
                    <Box component="span" sx={{ color: 'text.disabled' }}>
                      What to do ·{' '}
                    </Box>
                    {finding.fix}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    <Mono>{finding.code}</Mono>
                  </Typography>
                  {finding.deviceId && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      on install <Mono>{finding.deviceId}</Mono>
                    </Typography>
                  )}
                </Stack>

                {finding.evidence && <Evidence data={finding.evidence} label="The rows behind this" />}
              </Stack>
            </Panel>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
