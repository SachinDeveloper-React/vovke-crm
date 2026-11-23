import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { DialogButton } from '@/src/components/ui/dialog-button';
import { MaintenanceSync } from '@/src/layout/components/maintenance-flag';
import { DataTable, Mono, Panel, Stat, TextLink } from '@/src/components/ui';
import { ADMIN_TIMEZONE, adminGet } from '@/src/lib/api';
import { ago, dateTime, localInputValue, number } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { MaintenanceSettings } from '@/src/lib/types';

import { AddTesterForm, MaintenanceForm, RemoveTesterButton, TurnOffButton } from './forms';

/**
 * Maintenance mode (RULES DV14): one switch that stops every member at once
 * while the team works, the words they see while it is on, and the people
 * who carry on through it.
 *
 * The testers are on the same page as the switch on purpose. Turning
 * maintenance on with nobody able to get in is how a team finds out after
 * the fact that the fix did not work — so the list is in front of whoever is
 * about to press the button.
 */
export async function MaintenanceView() {
  const settings = await adminGet<MaintenanceSettings>('/admin/maintenance');
  const { maintenance, testers, staffAccounts } = settings;
  const on = maintenance.enabled;
  const endsAtInput = localInputValue(maintenance.endsAt, ADMIN_TIMEZONE);

  return (
    <Stack spacing={3}>
      <MaintenanceSync enabled={on} />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Members"
            value={on ? 'kept out' : 'using the app'}
            icon={on ? 'solar:shield-warning-bold-duotone' : 'solar:check-circle-bold-duotone'}
            goodDirection="none"
            hint={on ? 'Every member sees the maintenance screen' : 'Maintenance is off'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="On since"
            value={on ? ago(maintenance.startedAt) : '—'}
            icon="solar:clock-circle-bold-duotone"
            goodDirection="none"
            hint={on ? `${dateTime(maintenance.startedAt)}${maintenance.startedBy ? ` · ${maintenance.startedBy}` : ''}` : 'Not on'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Expected back"
            value={on && maintenance.endsAt ? dateTime(maintenance.endsAt) : '—'}
            icon="solar:calendar-bold-duotone"
            goodDirection="none"
            hint={on ? (maintenance.endsAt ? 'Shown to members on the screen' : 'No time promised') : 'Set when turning it on'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Can still get in"
            value={number(testers.length)}
            icon="solar:users-group-rounded-bold-duotone"
            goodDirection="none"
            hint={`tester(s), plus ${number(staffAccounts)} panel account(s) by their verified email`}
          />
        </Grid>
      </Grid>

      <Panel
        title={on ? 'Maintenance is on' : 'Maintenance is off'}
        subtitle={on ? 'Members are seeing the maintenance screen right now' : 'Members are using the app as normal'}
        note="Phones check every half minute and on every return to the app, so turning it on or off reaches everybody within a minute. Steps keep counting on the phone throughout and sync once it is off."
      >
        {on ? (
          <Stack spacing={3}>
            <Alert severity="warning" variant="outlined">
              Turned on {ago(maintenance.startedAt)}
              {maintenance.startedBy ? ` by ${maintenance.startedBy}` : ''}. Every member request is refused until it is off — nothing they
              send is taken, purchases included.
            </Alert>
            <TurnOffButton />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                The words on the screen
              </Typography>
              <MaintenanceForm intent="update" title={maintenance.title} message={maintenance.message} endsAt={endsAtInput} />
            </Box>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            {testers.length === 0 && staffAccounts === 0 && (
              <Alert severity="info" variant="outlined" sx={{ alignSelf: 'stretch' }}>
                Nobody would be able to use the app while it is on. Add a tester below first if somebody needs to check it.
              </Alert>
            )}
            <DialogButton
              label="Turn maintenance on"
              icon="solar:shield-warning-bold-duotone"
              color="error"
              variant="contained"
              size="medium"
              maxWidth="md"
              title="Turn maintenance on"
              subtitle="Every member sees this screen until it is turned off. Testers and staff carry on, with a strip saying maintenance is on."
            >
              <MaintenanceForm intent="on" title={maintenance.title} message={maintenance.message} endsAt="" />
            </DialogButton>
          </Stack>
        )}
      </Panel>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel
            title="Who can still use the app"
            subtitle={`${number(testers.length)} tester(s)`}
            note={`Testers use the app through maintenance with a strip at the top saying it is on. The ${number(
              staffAccounts,
            )} active panel account(s) get in the same way when they sign in to the app with the same email, once that email is verified in the app. A signed-out tester gets in through “Team sign-in” on the maintenance screen.`}
            dense
          >
            <DataTable
              columns={[
                { label: 'Member' },
                { label: 'Email' },
                { label: 'Phone' },
                { label: '', align: 'right', width: 56 },
              ]}
              rows={testers.map(tester => ({
                key: tester.id,
                cells: [
                  <Stack key="who" spacing={0.25}>
                    <TextLink href={paths.dashboard.users.detail(tester.id)} variant="subtitle2">
                      {tester.name || 'No name'}
                    </TextLink>
                    <Mono>{tester.id}</Mono>
                  </Stack>,
                  <Stack key="email" direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="body2">{tester.email ?? '—'}</Typography>
                    {tester.email && !tester.emailVerified && (
                      <Label color="default" variant="soft">
                        unverified
                      </Label>
                    )}
                  </Stack>,
                  tester.phone ?? '—',
                  <RemoveTesterButton key="remove" id={tester.id} label={tester.name || tester.email || tester.id} />,
                ],
              }))}
              empty="No testers yet. Add one so somebody can check the app while it is down."
            />
            <Box sx={{ p: 2 }}>
              <AddTesterForm />
            </Box>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Panel title="What members see" subtitle="The maintenance screen, in the words saved now">
            <Stack
              spacing={1}
              sx={{
                alignItems: 'center',
                textAlign: 'center',
                p: 3,
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                VOKVE
              </Typography>
              <Typography variant="h6">{maintenance.title}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 320 }}>
                {maintenance.message}
              </Typography>
              {on && maintenance.endsAt && (
                <Typography variant="subtitle2">Expected back by {dateTime(maintenance.endsAt)}</Typography>
              )}
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                The app opens by itself the moment we are back.
              </Typography>
              <Label color="primary" variant="soft">
                Try again
              </Label>
            </Stack>
          </Panel>
        </Grid>
      </Grid>
    </Stack>
  );
}
