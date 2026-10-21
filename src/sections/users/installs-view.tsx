import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { BoolChip, Kv, Mono, Panel, PermissionChip } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, dateTime, deviceLabel, humanise, number } from '@/src/lib/format';
import type { DevicePermissionRow, Page, UserOverview } from '@/src/lib/types';

/**
 * Every phone on the account, what it is, and what the OS lets it do.
 *
 * Read-only, all of it: the things support is tempted to do from here — flip
 * a permission, re-send a push — are not things a server can do on a phone's
 * behalf anyway. What it can do is say exactly which of them is the problem.
 */
export async function MemberInstalls({ userId }: { userId: string }) {
  const [overview, permissions] = await Promise.all([
    adminGet<UserOverview>(`/admin/users/${encodeURIComponent(userId)}`),
    adminGet<Page<DevicePermissionRow>>(`/admin/users/${encodeURIComponent(userId)}/permissions`),
  ]);
  const permissionOf = new Map(permissions.data.map(row => [row.deviceId, row]));

  if (overview.installs.length === 0) {
    return (
      <Panel title="No phone on this account">
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Every install has been revoked or removed, so nothing can count steps or receive a push. The member has to
          sign in on a phone again.
        </Typography>
      </Panel>
    );
  }

  return (
    <Stack spacing={3}>
      {overview.installs.map(install => {
        const allowed = permissionOf.get(install.deviceId);
        const signals = Object.entries(install.signals).filter(([, value]) => value === true);
        return (
          <Panel
            key={install.deviceId}
            title={deviceLabel(install.device)}
            subtitle={
              <>
                {install.platform === 'ios' ? 'iOS' : 'Android'} {install.device.osVersion ?? ''} · app{' '}
                {install.app.version ?? '—'} ({install.app.build ?? '—'}) · <Mono>{install.deviceId}</Mono>
              </>
            }
            action={
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {install.revokedAt && (
                  <Label color="error" variant="soft">
                    revoked
                  </Label>
                )}
                <Label color={install.signedIn ? 'success' : 'default'} variant="soft">
                  {install.signedIn ? 'signed in' : 'signed out'}
                </Label>
                {install.session.live && (
                  <Label color="info" variant="soft">
                    live session
                  </Label>
                )}
              </Stack>
            }
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  The phone
                </Typography>
                <Kv
                  items={[
                    { label: 'Brand · model', value: `${install.device.brand ?? '—'} · ${install.device.model ?? '—'}` },
                    { label: 'Manufacturer', value: install.device.manufacturer ?? '—' },
                    { label: 'Name', value: install.device.name ?? '—' },
                    { label: 'OS', value: install.device.osVersion ?? '—' },
                    { label: 'Emulator', value: <BoolChip value={install.device.isEmulator} goodWhen={false} yes="yes" no="no" /> },
                    { label: 'Tablet', value: install.device.isTablet ? 'yes' : 'no' },
                    { label: 'Memory', value: install.device.totalMemoryMb ? `${number(install.device.totalMemoryMb)} MB` : '—' },
                    { label: 'Screen', value: install.device.screen ? `${install.device.screen.w}×${install.device.screen.h} @${install.device.screen.scale}` : '—' },
                    { label: 'Carrier', value: install.device.carrier ?? '—' },
                    { label: 'Locale · zone', value: `${install.device.locale ?? '—'} · ${install.device.timezone ?? '—'}` },
                    { label: 'Biometrics', value: install.device.hasBiometrics === null ? '—' : install.device.hasBiometrics ? 'yes' : 'no' },
                  ]}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  This install
                </Typography>
                <Kv
                  items={[
                    { label: 'Installed', value: dateTime(install.installedAt), hint: ago(install.installedAt) },
                    { label: 'Last active', value: dateTime(install.lastActiveAt), hint: ago(install.lastActiveAt) },
                    { label: 'First build', value: install.app.firstVersion ?? '—' },
                    { label: 'Bundle', value: install.app.bundleId ?? '—' },
                    { label: 'Sign-ins', value: number(install.logins) },
                    { label: 'Signed in since', value: install.signedInAt ? dateTime(install.signedInAt) : '—' },
                    { label: 'Last signed out', value: install.lastSignedOutAt ? dateTime(install.lastSignedOutAt) : '—' },
                    { label: 'Session expires', value: install.session.expiresAt ? dateTime(install.session.expiresAt) : '—', hint: install.session.live ? `${number(install.session.tokens)} live token(s)` : 'no live token' },
                    { label: 'Revoked', value: install.revokedAt ? dateTime(install.revokedAt) : 'no' },
                    { label: 'Push token', value: <BoolChip value={install.push.hasToken} yes="on file" no="none" />, hint: install.push.updatedAt ? `updated ${ago(install.push.updatedAt)}` : undefined },
                    { label: 'Reminders scheduled', value: install.remindersScheduledAt ? ago(install.remindersScheduledAt) : 'not claimed' },
                  ]}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  What it has proved
                </Typography>
                <Kv
                  items={[
                    { label: 'Integrity', value: install.integrity.verdict ?? '—', hint: install.integrity.provider ? `${install.integrity.provider}${install.integrity.checkedAt ? ` · ${ago(install.integrity.checkedAt)}` : ''}` : undefined },
                    { label: 'Key attested', value: <BoolChip value={install.integrity.attested} yes="attested" no="not attested" /> },
                    { label: 'Security level', value: install.integrity.securityLevel ?? '—' },
                  ]}
                />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Signals the phone admitted
                  </Typography>
                  {signals.length === 0 ? (
                    <Label color="success" variant="soft">
                      nothing raised
                    </Label>
                  ) : (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                      {signals.map(([key]) => (
                        <Label key={key} color="error" variant="soft">
                          {humanise(key)}
                        </Label>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Grid>

              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  What the OS allows{' '}
                  <Box component="span" sx={{ color: 'text.disabled', fontWeight: 400 }}>
                    {allowed?.reportedAt ? `· as of ${ago(allowed.reportedAt)}` : '· never reported'}
                  </Box>
                </Typography>
                {!allowed || allowed.permissions.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    This install has never reported its permissions — most likely a build from before the app did.
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {allowed.permissions.map(permission => (
                      <Box key={permission.key} sx={{ minWidth: 0 }}>
                        <PermissionChip state={permission.state} label={humanise(permission.key)} />
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', mt: 0.25 }}>
                          since {ago(permission.since)}
                          {permission.detail ? ` · ${permission.detail}` : ''}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}

                {allowed && allowed.history.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.5 }}>
                      Last changes — “when did they turn notifications off” is the question that follows
                    </Typography>
                    <Stack spacing={0.5}>
                      {allowed.history.slice(0, 8).map((change, index) => (
                        <Typography key={`${change.key}-${change.at}-${index}`} variant="caption" sx={{ color: 'text.secondary' }}>
                          {dateTime(change.at)} · {humanise(change.key)}: {change.from ?? 'unknown'} → {change.to}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Panel>
        );
      })}
    </Stack>
  );
}
