import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { Label } from '@/src/components/label';
import { Kv, Mono, Panel, TextLink } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { failureText, providerLabel, verdictTone } from '@/src/lib/attestation';
import { number, percent } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { PhonesView } from '@/src/lib/types';

type Row = PhonesView['platforms'][number];

const PLATFORM = {
  android: { name: 'Android', proof: 'Google key attestation', icon: 'solar:smartphone-2-bold-duotone' },
  ios: { name: 'iPhone', proof: 'Apple App Attest', icon: 'solar:smartphone-bold-duotone' },
} as const;

/** The share of keys on file that were vouched for, coloured by how worrying it is. */
function attestedTone(share: number | null): 'success' | 'warning' | 'error' | 'default' {
  if (share === null) return 'default';
  if (share >= 0.9) return 'success';
  if (share >= 0.6) return 'warning';
  return 'error';
}

function PlatformCard({ row, children }: { row: Row; children?: ReactNode }) {
  const meta = PLATFORM[row.platform];
  const share = row.keyOnFile > 0 ? row.attested / row.keyOnFile : null;
  const tone = attestedTone(share);
  const unattested = row.keyOnFile - row.attested;

  return (
    <Box
      sx={{
        height: 1,
        p: 2.5,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.25,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'action.hover',
            flexShrink: 0,
          }}
        >
          <Iconify icon={meta.icon} width={22} sx={{ color: 'text.secondary' }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1">{meta.name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Keys vouched for by {meta.proof}
          </Typography>
        </Box>
        <Label color={tone} variant="soft">
          {share === null ? 'no keys yet' : `${percent(share, 0)} attested`}
        </Label>
      </Stack>

      <Box>
        <LinearProgress
          variant="determinate"
          value={share === null ? 0 : Math.round(share * 100)}
          color={tone === 'default' ? 'inherit' : tone}
          sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover' }}
        />
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.75 }}>
          {number(row.attested)} of {number(row.keyOnFile)} keys on file
        </Typography>
      </Box>

      <Kv
        columns={2}
        items={[
          { label: 'Installs', value: number(row.installs) },
          { label: 'Signed in now', value: number(row.signedIn) },
          { label: 'Key on file', value: number(row.keyOnFile) },
          { label: 'Synced in 30 days', value: number(row.syncing) },
        ]}
      />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Why the rest are not attested
        </Typography>
        {unattested === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {row.keyOnFile === 0 ? 'No phone has sent a key yet.' : 'Every key on file is attested.'}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {row.failures.map(entry => (
              <Stack key={entry.failure} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Label color="warning" variant="soft" sx={{ flexShrink: 0, minWidth: 40 }}>
                  {number(entry.installs)}
                </Label>
                <Box sx={{ minWidth: 0 }}>
                  <Mono>{entry.failure}</Mono>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {failureText(entry.failure)}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>

      {children}
    </Box>
  );
}

/**
 * Android and iPhone side by side: how much of each fleet has a key the
 * server trusts, and why the rest do not (D-104).
 *
 * The question this answers is the one the iPhone launch raises — "are they
 * attesting, and if not, why" — as a count by reason rather than a member
 * page at a time. The iPhone card also shows what an attestation must name,
 * because a wrong team id refuses every iPhone and a missing one leaves
 * every iPhone unattested, and either is invisible anywhere else.
 */
export async function PhonesPanel() {
  const view = await adminGet<PhonesView>('/admin/steps/phones');
  const android = view.platforms.find(row => row.platform === 'android');
  const ios = view.platforms.find(row => row.platform === 'ios');

  return (
    <Panel
      title="Phones and what vouches for them"
      subtitle="Android and iPhone side by side — keys on file, how many are attested, and why the rest are not"
      note="An unattested key still syncs, at a lower trust score; a refused attestation is never stored. Turning on ‘integrity.requireAttested’ makes an unattested key a refusal for both platforms."
    >
      <Grid container spacing={3}>
        {android && (
          <Grid size={{ xs: 12, md: 6 }}>
            <PlatformCard row={android} />
          </Grid>
        )}
        {ios && (
          <Grid size={{ xs: 12, md: 6 }}>
            <PlatformCard row={ios}>
              <Box sx={{ pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ flex: 1 }}>
                    What an iPhone must attest as
                  </Typography>
                  <TextLink variant="caption" href={{ pathname: paths.dashboard.config, query: { section: 'integrity' } }}>
                    Change in Config
                  </TextLink>
                </Stack>
                {!view.ios.teamId && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, color: 'warning.main' }}>
                    <Iconify icon="solar:shield-warning-bold-duotone" width={18} />
                    <Typography variant="caption">
                      No team id: every iPhone is kept unattested. Set APPLE_TEAM_ID or integrity.ios.teamId.
                    </Typography>
                  </Stack>
                )}
                <Kv
                  items={[
                    { label: 'Bundle', value: <Mono>{view.ios.bundleId}</Mono> },
                    {
                      label: 'Team',
                      value: view.ios.teamId ? <Mono>{view.ios.teamId}</Mono> : '—',
                      hint: view.ios.teamIdFrom === 'env' ? 'from APPLE_TEAM_ID' : view.ios.teamIdFrom === 'config' ? 'from config' : undefined,
                    },
                    {
                      label: 'Environments',
                      value: (
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 0.5 }}>
                          {[...new Set([...view.ios.environments, ...(view.ios.acceptsDevelopment ? ['development'] : [])])].map(environment => (
                            <Label key={environment} color={environment === 'production' ? 'success' : 'info'} variant="soft">
                              {environment}
                            </Label>
                          ))}
                        </Stack>
                      ),
                      hint: view.ios.acceptsDevelopment && !view.ios.environments.includes('development') ? 'development: outside production only' : undefined,
                    },
                  ]}
                />
              </Box>
            </PlatformCard>
          </Grid>
        )}
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Proofs recorded in the last {number(view.windowDays)} days
        </Typography>
        {view.proofs.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            Nothing was proved or refused in this window.
          </Typography>
        ) : (
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {view.proofs.map(proof => (
              <Stack
                key={`${proof.provider}-${proof.verdict}`}
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'center',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {providerLabel(proof.provider)}
                </Typography>
                <Label color={verdictTone(proof.verdict)} variant="soft">
                  {proof.verdict}
                </Label>
                <Typography variant="subtitle2">{number(proof.count)}</Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Panel>
  );
}
