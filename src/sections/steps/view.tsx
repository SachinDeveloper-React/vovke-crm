import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { DataTable, Mono, Panel, Stat, TextLink } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, coins, number, percent } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { StepsConfigView } from '@/src/lib/types';

import { ConfigSection } from './config-form';
import { at, STEPS_CONFIG_GROUPS } from './fields';

/**
 * Every knob the step pipeline has, in the order they matter.
 *
 * Nothing here is new behaviour: these are the same numbers the layers, the
 * nudge job and the economy have always read from ⚙ config. What is new is
 * that they can be read and turned without a database client — and that
 * each one sits next to what the code ships, so an override is visible as
 * an override rather than as a number somebody has to remember.
 */
export async function StepsConfigPage() {
  const config = await adminGet<StepsConfigView>('/admin/config/steps');
  const { effective, defaults, overrides } = config;
  const overridden = overrides.map(row => row.path);

  const mint = at(effective, 'coins.steps.enabled') === true;
  const per1000 =
    (1000 / Number(at(effective, 'coins.steps.unitSteps') ?? 100)) * Number(at(effective, 'coins.steps.coinsPerUnit') ?? 0);

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Minting step coins"
            value={mint ? 'On' : 'Off'}
            icon="solar:dollar-minimalistic-bold-duotone"
            goodDirection="none"
            hint={mint ? 'Verified days are being paid' : 'Days are scored and nothing is minted (shadow)'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Rate"
            value={`${coins(Math.round(per1000 * 1000) / 1000)} / 1,000`}
            icon="solar:tag-price-bold-duotone"
            goodDirection="none"
            hint={`capped at ${number(Number(at(effective, 'coins.sourceCaps.steps') ?? 0))} coins a day from steps`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="A day may be sent for"
            value={`${number(Number(at(effective, 'activity.maxAgeDays') ?? 0))} days`}
            icon="solar:calendar-bold-duotone"
            goodDirection="none"
            hint={`chased silently after ${number(Number(at(effective, 'activity.syncNudge.silentAfterHours') ?? 0))} h, said out loud after ${number(Number(at(effective, 'activity.syncNudge.remindAfterHours') ?? 0))} h`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Keys overridden"
            value={number(overrides.length)}
            icon="solar:settings-bold-duotone"
            goodDirection="none"
            hint={config.updatedAt ? `last changed ${ago(config.updatedAt)}${config.updatedBy ? ` by ${config.updatedBy}` : ''}` : 'everything is as the code ships it'}
          />
        </Grid>
      </Grid>

      {overrides.length > 0 && (
        <Panel
          title="What has been changed from the defaults"
          subtitle="Every key an operator has moved, and what the code ships"
          note="Putting one back is on the field itself, in the section below."
          dense
        >
          <DataTable
            columns={[{ label: 'Key' }, { label: 'In force', align: 'right' }, { label: 'Default', align: 'right' }]}
            rows={overrides.map(row => ({
              key: row.path,
              cells: [
                <Mono key="path">{row.path}</Mono>,
                <Typography key="value" variant="subtitle2" sx={{ fontFamily: 'var(--font-geist-mono)', fontSize: 12.5 }}>
                  {JSON.stringify(row.value)}
                </Typography>,
                <Typography key="default" variant="caption" sx={{ color: 'text.disabled', fontFamily: 'var(--font-geist-mono)' }}>
                  {JSON.stringify(row.default)}
                </Typography>,
              ],
            }))}
          />
        </Panel>
      )}

      {STEPS_CONFIG_GROUPS.map(group => (
        <Panel key={group.id} title={group.title} subtitle={group.subtitle} note={group.note}>
          <ConfigSection group={group} effective={effective} defaults={defaults} overridden={overridden} />
        </Panel>
      ))}

      <Box>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          These are everyone’s. One member’s own goal, timezone and notification switches are on their page — open them
          from <TextLink href={paths.dashboard.users.root}>Members</TextLink> and read the Config &amp; messages tab.
          What switching minting on would cost is on{' '}
          <TextLink href={paths.dashboard.economy}>Step economy</TextLink>.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
          <Label color="default" variant="soft">
            trust {at(effective, 'trust.shadow') === true ? 'in shadow' : 'enforced'}
          </Label>
          <Label color="default" variant="soft">
            a day verifies at {number(Number(at(effective, 'activity.verifiedMinScore') ?? 0))}/100
          </Label>
          <Label color="default" variant="soft">
            flagged above {number(Number(at(effective, 'activity.thresholds.maxDailySteps') ?? 0))} steps
          </Label>
          <Label color="default" variant="soft">
            refused above {number(Number(at(effective, 'activity.thresholds.impossibleDailySteps') ?? 0))}
          </Label>
          <Label color="default" variant="soft">
            unaccounted share {percent(Number(at(effective, 'activity.thresholds.unaccountedShare') ?? 0), 0)}
          </Label>
        </Stack>
      </Box>
    </Stack>
  );
}
