import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { BoolChip, Evidence, Kv, Mono, Panel, SelectFilter } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, dateTime, deviceLabel, duration, number } from '@/src/lib/format';
import type { DeviceHealth } from '@/src/lib/types';

/**
 * Why the app is not working for them (RULES P17).
 *
 * Two feeds read together, because the answer is usually in both: each
 * install's own verdict on itself — the tracker's service, Health Connect's
 * grants, the state of the sync — and the faults the app has hit. Beside each
 * install sits the one thing the server knows and the phone does not: when
 * that install last actually reported steps.
 */
export async function MemberHealth({ userId, errors }: { userId: string; errors: number }) {
  const health = await adminGet<DeviceHealth>(`/admin/users/${encodeURIComponent(userId)}/health`, { errors });

  return (
    <Stack spacing={3}>
      {health.devices.length === 0 && (
        <Panel title="No install to ask">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Nothing has ever registered against this account.
          </Typography>
        </Panel>
      )}

      {health.devices.map(device => {
        const report = device.health;
        const tracking = report?.tracking;
        const hc = report?.healthConnect;
        const sync = report?.sync;
        return (
          <Panel
            key={device.deviceId}
            title={deviceLabel(device)}
            subtitle={
              <>
                app {device.appVersion ?? '—'} · last request {ago(device.lastSeenAt)} · <Mono>{device.deviceId}</Mono>
              </>
            }
            action={
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                <Label color={device.signedIn ? 'success' : 'default'} variant="soft">
                  {device.signedIn ? 'signed in' : 'signed out'}
                </Label>
                {report?.stale && (
                  <Label color="warning" variant="soft">
                    report is stale
                  </Label>
                )}
                {tracking?.looksDead && (
                  <Label color="error" variant="soft">
                    counter dead
                  </Label>
                )}
                {sync?.status === 'failed' && (
                  <Label color="error" variant="soft">
                    sync failing
                  </Label>
                )}
              </Stack>
            }
            note={
              report
                ? `The phone's own verdict, as it put it together ${ago(report.at)}.`
                : 'This install has never said whether it is working — most likely a build from before diagnostics existed.'
            }
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Reporting to us
                </Typography>
                <Kv
                  items={[
                    { label: 'Last snapshot accepted', value: ago(device.stepSync.uploadedAt), hint: dateTime(device.stepSync.uploadedAt) },
                    { label: 'Last pushed to sync', value: ago(device.stepSync.nudgedAt) },
                    { label: 'Last told in words', value: ago(device.stepSync.remindedAt) },
                    { label: 'Revoked', value: device.revoked ? 'yes' : 'no' },
                  ]}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  The step counter
                </Typography>
                {tracking ? (
                  <Kv
                    items={[
                      { label: 'State', value: tracking.state ?? '—' },
                      { label: 'Counting wanted', value: <BoolChip value={tracking.wanted ?? null} yes="on" no="off" /> },
                      { label: 'Service alive', value: <BoolChip value={tracking.serviceAlive ?? null} yes="alive" no="dead" /> },
                      { label: 'Heartbeat age', value: duration(tracking.heartbeatAgeMs ?? null) },
                      { label: 'Restarts since start', value: number(tracking.recoveryCount ?? null), hint: tracking.lastRecoveryReason ?? undefined },
                      { label: 'Battery optimisation', value: <BoolChip value={tracking.batteryOptimizationEnabled ?? null} goodWhen={false} yes="on" no="off" /> },
                      { label: 'Aggressive OEM', value: tracking.aggressiveOem === undefined ? '—' : tracking.aggressiveOem ? 'yes' : 'no', hint: tracking.manufacturer ?? undefined },
                    ]}
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    Nothing reported.
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Health Connect and the sync
                </Typography>
                <Kv
                  items={[
                    { label: 'Health Connect', value: hc?.availability ?? '—' },
                    { label: 'May read steps', value: <BoolChip value={hc?.canRead ?? null} yes="yes" no="no" /> },
                    { label: 'May write steps', value: <BoolChip value={hc?.canWrite ?? null} yes="yes" no="no" /> },
                    { label: 'Sync status', value: sync?.status ?? '—' },
                    { label: 'Days queued', value: number(sync?.queued ?? null) },
                    { label: 'Phone says today', value: sync?.todaySteps === undefined ? '—' : `${number(sync.todaySteps)} steps` },
                    { label: 'Last synced', value: sync?.lastSyncedAt ? ago(sync.lastSyncedAt) : '—' },
                  ]}
                />
                {sync?.error && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: 'error.main' }}>
                      The phone&apos;s own reason: {sync.error}
                    </Typography>
                  </Box>
                )}
                {hc?.grantedReadTypes && hc.grantedReadTypes.length > 0 && (
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                    {hc.grantedReadTypes.map(type => (
                      <Label key={type} color="info" variant="soft">
                        {type}
                      </Label>
                    ))}
                  </Stack>
                )}
              </Grid>
            </Grid>
          </Panel>
        );
      })}

      <Panel
        title="What has gone wrong on their phones"
        subtitle={`${number(health.errors.total)} fault group${health.errors.total === 1 ? '' : 's'} on file · ${number(health.errors.data.length)} shown`}
        note="Grouped by fingerprint, not by occurrence: the interesting number is that this has happened 240 times since Tuesday. Faults are kept for thirty days."
        action={
          <SelectFilter
            label="Show"
            param="errors"
            value={String(errors)}
            options={[25, 50, 100].map(option => ({ value: String(option), label: `${option} groups` }))}
            width={140}
          />
        }
        dense
      >
        <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
          {health.errors.data.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.disabled', px: 3, py: 3 }}>
              The app has not reported a single fault on this account.
            </Typography>
          )}
          {health.errors.data.map(error => (
            <Box key={`${error.deviceId}-${error.fingerprint}`} sx={{ px: 3, py: 2 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                <Label color={error.fatal ? 'error' : 'warning'} variant="soft">
                  {error.fatal ? 'crash' : 'handled'}
                </Label>
                <Typography variant="subtitle2">{error.name ?? error.kind}</Typography>
                {error.screen && (
                  <Label color="default" variant="soft">
                    {error.screen}
                  </Label>
                )}
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  ×{number(error.count)} · first {ago(error.firstAt)} · last {ago(error.lastAt)}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ fontFamily: 'var(--font-geist-mono)', fontSize: 12.5, color: 'text.secondary' }}>
                {error.message}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
                {error.scope ? `in ${error.scope} · ` : ''}build {error.appVersion ?? '—'} ({error.build ?? '—'}) · OS{' '}
                {error.osVersion ?? '—'} · <Mono>{error.fingerprint}</Mono>
              </Typography>
              {error.context && <Evidence data={error.context} label="Context" />}
              {error.stack && (
                <Box
                  component="details"
                  sx={{ mt: 1, '& summary': { cursor: 'pointer', typography: 'caption', color: 'text.disabled' } }}
                >
                  <Box component="summary">The stack, as the phone sent it</Box>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      mt: 1,
                      p: 1.25,
                      borderRadius: 1,
                      bgcolor: 'var(--mui-palette-background-neutral)',
                      fontFamily: 'var(--font-geist-mono)',
                      fontSize: 11.5,
                      lineHeight: 1.6,
                      overflowX: 'auto',
                      maxHeight: 320,
                      color: 'text.secondary',
                    }}
                  >
                    {error.stack}
                  </Box>
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      </Panel>
    </Stack>
  );
}
