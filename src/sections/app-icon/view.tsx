import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { DataTable, Panel, Stat } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, dateTime, number } from '@/src/lib/format';
import type { AppIconEntry, AppIconSettings } from '@/src/lib/types';

import { IconChoiceButton, RemoveWindowButton, ScheduleWindowForm } from './forms';

/**
 * Which launcher icon members' phones show (RULES DV13).
 *
 * Every icon is inside the app — neither Android nor iOS will put a
 * downloaded picture on a home screen — so this page only ever chooses among
 * the ones a build carries, and a phone on an older build keeps its
 * everyday icon. A change reaches each phone the next time it is opened:
 * iOS switches there and then with its own alert, Android when the member
 * next leaves the app. A member can turn festive icons off in the app.
 */

/** A hairline on top of the art, so the white Classic icon does not vanish into a white card. */
const EDGE = { outline: '1px solid var(--mui-palette-divider)', outlineOffset: '-1px' } as const;

/** The square art beside the round one, as each kind of launcher cuts it. */
function Preview({ icon, size = 72 }: { icon: string; size?: number }) {
  return (
    <Stack direction="row" spacing={1}>
      <Box
        component="img"
        src={`/app-icons/${icon}-square.webp`}
        alt=""
        width={size}
        height={size}
        sx={{ width: size, height: size, borderRadius: `${Math.round(size * 0.22)}px`, display: 'block', ...EDGE }}
      />
      <Box
        component="img"
        src={`/app-icons/${icon}-circle.webp`}
        alt=""
        width={size}
        height={size}
        sx={{ width: size, height: size, display: 'block', borderRadius: '50%', ...EDGE }}
      />
    </Stack>
  );
}

function Tile({ icon, badges, children }: { icon: AppIconEntry; badges: ReactNode; children: ReactNode }) {
  return (
    <Stack
      spacing={1.5}
      sx={{ p: 2, height: 1, borderRadius: 2, border: 1, borderColor: 'divider' }}
    >
      <Preview icon={icon.key} />
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
        <Typography variant="subtitle2">{icon.label}</Typography>
        {badges}
      </Stack>
      {children}
    </Stack>
  );
}

export async function AppIconView() {
  const settings = await adminGet<AppIconSettings>('/admin/app-icon');
  const labelOf = (key: string | null) =>
    key === null ? 'none' : (settings.catalog.find(icon => icon.key === key)?.label ?? key);
  const bases = settings.catalog.filter(icon => icon.kind === 'base' && !icon.retired);
  const festive = settings.catalog.filter(icon => icon.kind === 'festive' && !icon.retired);
  const upcoming = settings.schedule.filter(entry => entry.state === 'upcoming');
  const reporting = settings.devices.filter(row => row.icon !== null).reduce((sum, row) => sum + row.devices, 0);
  const seen = settings.devices.reduce((sum, row) => sum + row.devices, 0);
  const onLive = settings.devices.filter(row => row.icon === settings.live.icon).reduce((sum, row) => sum + row.devices, 0);

  const scheduledFor = (key: string) => settings.schedule.find(entry => entry.icon === key && entry.state !== 'closed');

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Showing now"
            value={labelOf(settings.live.icon)}
            icon="solar:smartphone-2-bold-duotone"
            goodDirection="none"
            hint={
              settings.live.source === 'manual'
                ? 'Festive, switched on by hand'
                : settings.live.source === 'schedule'
                  ? `Festive, scheduled until ${dateTime(settings.live.until)}`
                  : 'The everyday icon'
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Everyday icon"
            value={labelOf(settings.base)}
            icon="solar:gallery-wide-bold-duotone"
            goodDirection="none"
            hint="Shown whenever nothing festive is on, and to members who turned festive icons off"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Next on the schedule"
            value={upcoming[0] ? labelOf(upcoming[0].icon) : 'nothing'}
            icon="solar:calendar-mark-bold-duotone"
            goodDirection="none"
            hint={upcoming[0] ? `from ${dateTime(upcoming[0].startsAt)}` : 'Add a festive window below'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label={`Phones on ${labelOf(settings.live.icon)}`}
            value={number(onLive)}
            icon="solar:check-circle-bold-duotone"
            goodDirection="none"
            hint={`${number(reporting)} of ${number(seen)} phones seen in ${settings.activeDays} days have reported an icon`}
          />
        </Grid>
      </Grid>

      <Panel
        title="Everyday icon"
        subtitle="What every phone shows when nothing festive is on"
        note="The change reaches each phone the next time it is opened. iOS switches at once and tells the member with its own alert; Android switches when they next leave the app, because swapping the icon while the app is open can close it."
      >
        <Grid container spacing={2}>
          {bases.map(icon => {
            const isBase = settings.base === icon.key;
            return (
              <Grid key={icon.key} size={{ xs: 12, sm: 6, md: 4 }}>
                <Tile
                  icon={icon}
                  badges={
                    <>
                      {isBase && (
                        <Label color="success" variant="soft">
                          everyday
                        </Label>
                      )}
                      {icon.key === settings.defaultIcon && (
                        <Label color="default" variant="soft">
                          fresh install
                        </Label>
                      )}
                    </>
                  }
                >
                  <IconChoiceButton
                    slot="base"
                    icon={icon.key}
                    label={isBase ? 'The everyday icon' : 'Make it the everyday icon'}
                    variant={isBase ? 'text' : 'outlined'}
                    disabled={isBase}
                  />
                </Tile>
              </Grid>
            );
          })}
        </Grid>
      </Panel>

      <Panel
        title="Festive icons"
        subtitle="Switch one on now, or put it on the schedule below"
        note="Switched on by hand, a festive icon stays until it is switched off, and wins over the schedule. Members who turned festive icons off in the app keep the everyday icon. A phone on a build without that icon keeps the everyday one too."
      >
        <Grid container spacing={2}>
          {festive.map(icon => {
            const isManual = settings.festive === icon.key;
            const isLive = settings.live.festive === icon.key;
            const window = scheduledFor(icon.key);
            return (
              <Grid key={icon.key} size={{ xs: 12, sm: 6, md: 4 }}>
                <Tile
                  icon={icon}
                  badges={
                    <>
                      {isLive && (
                        <Label color="success" variant="soft">
                          {isManual ? 'on by hand' : 'on, scheduled'}
                        </Label>
                      )}
                      {!isLive && window && (
                        <Label color="info" variant="soft">
                          {window.state === 'live' ? 'window open now' : `from ${dateTime(window.startsAt)}`}
                        </Label>
                      )}
                    </>
                  }
                >
                  {isManual ? (
                    <IconChoiceButton slot="festive" icon="" label="Switch it off" color="error" />
                  ) : (
                    <IconChoiceButton slot="festive" icon={icon.key} label="Switch on now" />
                  )}
                </Tile>
              </Grid>
            );
          })}
        </Grid>
      </Panel>

      <Panel
        title="The schedule"
        subtitle={`${number(upcoming.length)} coming up · times in the panel's own zone`}
        note="A window turns its festive icon on when it opens and off when it closes, with nobody at the panel. Phones only learn of it when they are opened, so open a window a day early for an icon to be on screen on the morning itself."
        dense
      >
        <DataTable
          columns={[
            { label: 'Icon' },
            { label: 'From' },
            { label: 'Until' },
            { label: 'State' },
            { label: 'Note' },
            { label: '', align: 'right', width: 72 },
          ]}
          rows={settings.schedule.map(entry => ({
            key: entry.id,
            cells: [
              <Stack key="icon" direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box
                  component="img"
                  src={`/app-icons/${entry.icon}-circle.webp`}
                  alt=""
                  width={28}
                  height={28}
                  sx={{ width: 28, height: 28, borderRadius: '50%', ...EDGE }}
                />
                <Typography variant="subtitle2">{labelOf(entry.icon)}</Typography>
              </Stack>,
              dateTime(entry.startsAt),
              dateTime(entry.endsAt),
              <Label
                key="state"
                variant="soft"
                color={entry.state === 'live' ? 'success' : entry.state === 'upcoming' ? 'info' : 'default'}
              >
                {entry.state === 'live' ? (settings.festive ? 'open, overridden by hand' : 'on now') : entry.state}
              </Label>,
              entry.note ?? '—',
              <RemoveWindowButton key="remove" id={entry.id} label={labelOf(entry.icon)} />,
            ],
          }))}
          empty="Nothing scheduled. Add a festival below and its icon turns itself on and off."
        />
        <Box sx={{ p: 2.5 }}>
          <ScheduleWindowForm icons={festive.map(icon => ({ key: icon.key, label: icon.label }))} />
        </Box>
      </Panel>

      <Panel
        title="What the phones say they show"
        subtitle={`Devices seen in the last ${settings.activeDays} days`}
        note="Each install reports its icon after it has changed. “Not reported” is a build from before icons could change, or one that has not been opened since."
        dense
      >
        <DataTable
          columns={[{ label: 'Icon' }, { label: 'Platform' }, { label: 'Phones', align: 'right' }]}
          rows={settings.devices.map(row => ({
            key: `${row.icon ?? 'none'}-${row.platform}`,
            cells: [
              row.icon ? labelOf(row.icon) : 'Not reported',
              row.platform === 'ios' ? 'iOS' : 'Android',
              number(row.devices),
            ],
          }))}
          empty="No device has been seen in that time."
        />
      </Panel>

      {settings.updatedAt && (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {`App settings last changed ${ago(settings.updatedAt)}${settings.updatedBy ? ` by ${settings.updatedBy}` : ''}.`}
        </Typography>
      )}
    </Stack>
  );
}
