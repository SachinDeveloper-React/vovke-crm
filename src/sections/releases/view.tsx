import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { DataTable, Kv, Panel, ReleaseStatusChip, Stat } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, dateTime, number } from '@/src/lib/format';
import type { Platform, ReleasesResponse } from '@/src/lib/types';

import { NewReleaseForm, UpdatePolicyForm } from './forms';

/**
 * The releases, and the line below which a build is refused (RULES DV12).
 *
 * Deliberately two decisions rather than one. Telling the app about a build
 * is a knock at most; **making an update mandatory is raising the minimum**,
 * which walls off every build below it. Keeping them apart means a routine
 * release cannot accidentally lock anybody out, and a wall is never a side
 * effect of shipping.
 */
export async function ReleasesView() {
  const releases = await adminGet<ReleasesResponse>('/admin/releases');
  const rows = releases.data;
  const refused = rows.filter(row => row.refused);
  const current = (platform: Platform) => rows.find(row => row.platform === platform && row.status === 'current');

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="iOS in force"
            value={releases.minVersion.ios}
            icon="solar:apple-bold-duotone"
            hint={`store is serving ${current('ios')?.version ?? 'nothing recorded'}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Android in force"
            value={releases.minVersion.android}
            icon="solar:android-bold-duotone"
            hint={`store is serving ${current('android')?.version ?? 'nothing recorded'}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Builds walled off"
            value={number(refused.length)}
            goodDirection="none"
            icon="solar:lock-bold-duotone"
            hint="Below their platform's minimum — every request answers 426"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Knock on a newer build"
            value={releases.nudgeOnNewer ? 'on' : 'off'}
            icon="solar:bell-bold-duotone"
            goodDirection="none"
            hint={releases.nudgeOnNewer ? 'A newer current release knocks once a day' : 'Only a deprecated build knocks'}
          />
        </Grid>
      </Grid>

      <Panel
        title="Every build the server knows about"
        subtitle={`${number(rows.length)} recorded`}
        note="“Refused” is what the version gate would do to that build today, not a status somebody set."
        dense
      >
        <DataTable
          columns={[
            { label: 'Platform' },
            { label: 'Version' },
            { label: 'Build' },
            { label: 'Status' },
            { label: 'Gate' },
            { label: 'Notes' },
            { label: 'Released', align: 'right' },
          ]}
          rows={rows.map(row => ({
            key: row.id,
            tone: row.refused ? 'danger' : 'default',
            cells: [
              row.platform === 'ios' ? 'iOS' : 'Android',
              <Typography key="v" variant="subtitle2">
                {row.version}
              </Typography>,
              row.build,
              <ReleaseStatusChip key="status" status={row.status} />,
              row.refused ? (
                <Label key="gate" color="error" variant="soft">
                  refused
                </Label>
              ) : (
                <Label key="gate" color="success" variant="soft">
                  served
                </Label>
              ),
              <Typography key="notes" variant="caption" sx={{ color: 'text.secondary', maxWidth: 280, display: 'block' }}>
                {row.notes ?? '—'}
                {row.minOs ? ` · needs OS ${row.minOs}` : ''}
              </Typography>,
              <Stack key="at" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{ago(row.releasedAt)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {dateTime(row.releasedAt)}
                </Typography>
              </Stack>,
            ],
          }))}
          empty="No release has been recorded. The app will knock at nobody until one is."
        />
      </Panel>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel
            title="Record a release"
            subtitle="What the store is now serving"
            note="One current release per platform: naming a new one steps the old one down to supported."
          >
            <NewReleaseForm />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel
            title="The wall, and the words on it"
            subtitle="Raising a minimum is what makes an update mandatory"
            note="Every word a prompt shows is the server's, so a wall can go up, come down or be reworded without shipping an app to say it."
          >
            <UpdatePolicyForm
              minIos={releases.minVersion.ios}
              minAndroid={releases.minVersion.android}
              nudgeOnNewer={releases.nudgeOnNewer}
            />
          </Panel>
        </Grid>
      </Grid>

      <Panel title="Where the app sends them" dense={false}>
        <Kv
          items={Object.entries(releases.storeUrl ?? {}).map(([platform, url]) => ({
            label: platform === 'ios' ? 'iOS store' : platform === 'android' ? 'Play store' : platform,
            value: String(url),
          }))}
        />
      </Panel>
    </Stack>
  );
}
