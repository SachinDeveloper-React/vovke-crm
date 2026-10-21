import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { ApiErrorNotice, DataTable, Mono, OffsetPager, Panel, Stat, type Row } from '@/src/components/ui';
import { adminTry } from '@/src/lib/api';
import { humanise, number } from '@/src/lib/format';
import type { StepsTimeline, TimelineClaim, TimelineDevice } from '@/src/lib/types';

import { readStatus, SourceChips, SourceName, sourceFigures, statusOf } from './step-sources';
import { TimelineFilters, TimelineRejectForm } from './timeline-controls';

/**
 * One member's day, minute by minute, and which phone each minute was taken
 * from (D-53, D-88).
 *
 * The question behind it is the one the owner kept asking: the phone says
 * 11,000 and the day says 8,000 — where did the rest go? Every other screen
 * answers that per device or per day, which is too coarse, because the
 * decision is made per *minute*: a minute goes to whichever phone counted
 * the most in it and the others' steps for that minute are dropped. So this
 * is the decision at the grain it is actually made at, with the dropped
 * steps named rather than silently missing.
 *
 * Rows are the whole day's (at most 1,440 of them, and only minutes with
 * steps), read once and paged here: a cursor over a list that short would be
 * a round trip per page for no gain. `?overlaps=only` is the filter that
 * matters — it leaves just the minutes more than one phone claimed, which on
 * a member with several installs is the handful worth reading.
 *
 * The minutes answer *which phone*; the panels above them answer *which
 * source* (D-51). They are deliberately not one table: a minute belongs to a
 * handset's own sensor, while an app that writes to Health Connect gives the
 * day records and, at best, its own hours — so an app's steps can be placed
 * in an hour and never in a minute, and a table that mixed the two would be
 * inventing a precision the evidence does not have.
 */
export async function MemberTimelineView({
  userId,
  date,
  overlapsOnly,
  offset,
  limit,
  view,
}: {
  userId: string;
  date: string;
  overlapsOnly: boolean;
  offset: number;
  limit: number;
  view: 'runs' | 'minutes';
}) {
  const answer = await adminTry<StepsTimeline>(`/admin/users/${encodeURIComponent(userId)}/steps/timeline`, {
    date,
    overlapsOnly,
  });
  if ('error' in answer) {
    return (
      <Stack spacing={3}>
        <TimelineFilters userId={userId} date={date} overlapsOnly={overlapsOnly} limit={limit} view={view} />
        <ApiErrorNotice error={answer.error} what="this day's minutes" />
      </Stack>
    );
  }

  const { totals, devices, hours, runs, rows, withoutMinutes, timezone, localDay, scored, sources, sourceHours } =
    answer.data;
  const page = rows.slice(offset, offset + limit);

  // A colour per phone, so the hour strip, the rows and the legend all read
  // as the same few devices rather than as a wall of ids.
  const tones = ['info', 'warning', 'secondary', 'success', 'error'] as const;
  const toneOf = new Map(devices.map((device, index) => [device.deviceId, tones[index % tones.length]]));

  const claim = (entry: TimelineClaim) => (
    <Label key={entry.deviceId} color={entry.picked ? toneOf.get(entry.deviceId) : 'default'} variant="soft">
      {entry.name} {number(entry.steps)}
      {entry.picked ? '' : ' ✕'}
    </Label>
  );

  const minuteRows: Row[] = page.map(row => ({
    key: String(row.epochMs),
    tone: row.overlap ? 'danger' : 'default',
    cells: [
      <Mono key="at">{row.at}</Mono>,
      `${row.parts.weekday} ${String(row.parts.hour).padStart(2, '0')}:${String(row.parts.minute).padStart(2, '0')}:${String(row.parts.second).padStart(2, '0')}`,
      number(row.steps),
      row.rejectedSteps > 0 ? number(row.rejectedSteps) : '—',
      <Stack key="claims" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
        {row.claims.map(claim)}
      </Stack>,
    ],
  }));

  /**
   * Which source answered on one phone: the Health Connect app that won, else
   * the app the phone was showing, else the phone's own counter. Named by the
   * app's own name where the phone reported one, because a package name is
   * not what a member reads in their Health Connect settings.
   */
  const sourceOf = (device: TimelineDevice) => {
    const picked = device.winnerApp ?? device.shownApp;
    if (!picked) return { appName: 'Phone step counter', isWearable: false, shown: false };
    const app = device.sources.find(source => source.packageName === picked);
    return {
      appName: app?.appName ?? picked,
      isWearable: app?.isWearable ?? false,
      shown: device.winnerApp === null,
    };
  };

  const deviceRows: Row[] = devices.map(device => ({
    key: device.deviceId,
    tone: device.rejected ? 'danger' : 'default',
    cells: [
      <Stack key="who" spacing={0.25}>
        <Typography variant="body2">
          <Label color={toneOf.get(device.deviceId)} variant="soft">
            {device.name}
          </Label>
        </Typography>
        <Mono>{device.deviceId}</Mono>
      </Stack>,
      number(device.deviceSteps),
      <Stack key="source" spacing={0.25}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
          <Typography variant="body2">{sourceOf(device).appName}</Typography>
          <SourceChips source={sourceOf(device)} />
        </Stack>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {device.source ? humanise(device.source) : 'not scored'} · {readStatus(device.sourcesStatus)}
        </Typography>
      </Stack>,
      number(device.countedSteps),
      device.rejectedSteps > 0 ? number(device.rejectedSteps) : '—',
      number(device.minutesClaimed),
      device.minutesKept ? '—' : 'No minutes kept',
      <Stack key="periods" spacing={0.25}>
        {device.counting.length === 0 ? (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            No sign-in recorded
          </Typography>
        ) : (
          device.counting.map(period => (
            <Mono key={`${period.from}-${period.to}`}>
              {(period.from ?? '?').slice(0, 16).replace('T', ' ')} → {period.to ? period.to.slice(0, 16).replace('T', ' ') : 'open'}
            </Mono>
          ))
        )}
      </Stack>,
      device.rejected ? (
        <Stack key="out" spacing={0.25}>
          <Label color="error" variant="soft">
            Left out
          </Label>
          {device.rejectedNote ? (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {device.rejectedNote}
            </Typography>
          ) : null}
        </Stack>
      ) : (
        '—'
      ),
    ],
  }));

  const nameOf = (deviceId: string | null) =>
    devices.find(device => device.deviceId === deviceId)?.name ?? deviceId ?? '—';

  const runRows: Row[] = runs.map(run => ({
    key: String(run.epochMs),
    tone: run.overlap ? 'danger' : 'default',
    cells: [
      <Mono key="span">
        {run.from.slice(11, 19)}
        {run.minutes > 1 ? ` → ${run.to.slice(11, 19)}` : ''}
      </Mono>,
      `${run.minutes} min`,
      number(run.steps),
      run.rejectedSteps > 0 ? number(run.rejectedSteps) : '—',
      <Label key="picked" color={toneOf.get(run.pickedDeviceId ?? '')} variant="soft">
        {nameOf(run.pickedDeviceId)}
      </Label>,
      run.overlap ? (
        <Stack key="also" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {run.deviceIds
            .filter(deviceId => deviceId !== run.pickedDeviceId)
            .map(deviceId => (
              <Label key={deviceId} color="default" variant="soft">
                {nameOf(deviceId)} ✕
              </Label>
            ))}
        </Stack>
      ) : (
        '—'
      ),
    ],
  }));

  const hourRows: Row[] = hours
    .filter(hour => hour.minutes > 0)
    .map(hour => ({
      key: String(hour.hour),
      cells: [
        `${String(hour.hour).padStart(2, '0')}:00`,
        number(hour.steps),
        hour.rejectedSteps > 0 ? number(hour.rejectedSteps) : '—',
        number(hour.minutes),
        hour.overlapMinutes > 0 ? number(hour.overlapMinutes) : '—',
        <Stack key="who" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {hour.devices.filter(Boolean).map(deviceId => (
            <Label key={String(deviceId)} color={toneOf.get(String(deviceId))} variant="soft">
              {devices.find(device => device.deviceId === deviceId)?.name ?? String(deviceId)}
            </Label>
          ))}
        </Stack>,
      ],
    }));

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {localDay} in {timezone} · the minute is the grain the day is decided at
        </Typography>
        <TimelineFilters userId={userId} date={date} overlapsOnly={overlapsOnly} limit={limit} view={view} />
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="Steps the day took" value={number(totals.steps)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Dropped as duplicates"
            value={number(totals.rejectedSteps)}
            hint="Another phone claimed the same minute"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Minutes two phones claimed"
            value={`${number(totals.overlapMinutes)} of ${number(totals.minutes)}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Phones on this day"
            value={number(totals.devices)}
            hint={totals.rejectedDevices > 0 ? `${number(totals.rejectedDevices)} left out by hand` : undefined}
          />
        </Grid>
      </Grid>

      <Panel
        title="The sources behind this day"
        subtitle={
          scored
            ? scored.answeredBy
              ? `The day's ${number(scored.steps)} came from ${scored.answeredBy.appName}${scored.phonesAdded ? ', the phones added minute by minute' : ''}`
              : `The day's ${number(scored.steps)} was written without a source behind it`
            : 'Nothing has scored this day yet, so these are the phones’ own minutes'
        }
        note="`Written` is everything a source recorded for the day; `countable` is what the rules let count, and the two differ where steps were typed in or arrived with no recording method. Only one source answers for a day — the scoring never splits a day between two."
        dense
      >
        <DataTable
          columns={[
            { label: 'Source' },
            { label: 'What it recorded' },
            { label: 'What became of it' },
            { label: 'Its own hours' },
          ]}
          rows={sources.map(source => ({
            key: source.key,
            cells: [
              <SourceName key="who" source={source} />,
              sourceFigures(source),
              <Label key="status" color={statusOf(source.status).tone} variant="soft">
                {statusOf(source.status).label}
              </Label>,
              source.hourly === null ? (
                <Typography key="hours" variant="caption" sx={{ color: 'text.disabled' }}>
                  none kept — it cannot be placed in time
                </Typography>
              ) : (
                `${number(source.hourly.filter(steps => steps > 0).length)} hour(s) with steps`
              ),
            ],
          }))}
          empty="No source is stored for this day."
        />
      </Panel>

      <Panel
        title="The phones, and which one the day counts"
        subtitle="Leaving a phone out re-scores the day without it. A day always keeps at least one, so the one it should count is the one left unticked."
      >
        <DataTable
          columns={[
            { label: 'Phone' },
            { label: 'Its own count', align: 'right' },
            { label: 'Step source' },
            { label: 'Counted', align: 'right' },
            { label: 'Dropped', align: 'right' },
            { label: 'Minutes', align: 'right' },
            { label: 'Evidence' },
            { label: 'Signed in' },
            { label: 'Override' },
          ]}
          rows={deviceRows}
          empty="No phone sent this day."
        />
        {devices.length > 1 ? (
          <TimelineRejectForm userId={userId} localDay={localDay} devices={devices} />
        ) : (
          <Typography variant="caption" sx={{ color: 'text.secondary', px: 3, py: 2, display: 'block' }}>
            One phone sent this day, so there is nothing to choose between.
          </Typography>
        )}
      </Panel>

      {withoutMinutes.length > 0 ? (
        <Panel
          title="Phones whose steps cannot be placed in time"
          subtitle="Stored before minutes were kept, so their steps are real and absent from every row below."
        >
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, px: 3, py: 2 }}>
            {withoutMinutes.map(deviceId => (
              <Mono key={deviceId}>{deviceId}</Mono>
            ))}
          </Stack>
        </Panel>
      ) : null}

      <Panel title="Hour by hour" subtitle="Where the day's steps came from, and where two phones were both counting.">
        <DataTable
          columns={[
            { label: 'Hour' },
            { label: 'Counted', align: 'right' },
            { label: 'Dropped', align: 'right' },
            { label: 'Minutes', align: 'right' },
            { label: 'Overlapping', align: 'right' },
            { label: 'Taken from' },
          ]}
          rows={hourRows}
          empty="No minute of this day carried steps."
        />
      </Panel>

      <Panel
        title="Hour by hour, source by source"
        subtitle="When each source says the steps were taken"
        note="The phone counter's hours are the minutes above — the union the day is decided from. An app's are the hours its own tracker computed, taken as the largest any phone reported rather than added, because two phones read the same Health Connect records. A source that computed no hours is in the panel above and absent here."
      >
        <DataTable
          columns={[{ label: 'Hour' }, { label: 'From the minutes', align: 'right' }, { label: 'What each source says' }]}
          rows={sourceHours
            .filter(hour => hour.steps > 0 || hour.bySource.length > 0)
            .map(hour => ({
              key: `source-${hour.hour}`,
              cells: [
                `${String(hour.hour).padStart(2, '0')}:00`,
                hour.steps > 0 ? number(hour.steps) : '—',
                <Stack key="who" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {hour.bySource.map(source => (
                    <Label key={source.key} color={source.answered ? 'success' : 'default'} variant="soft">
                      {source.appName} {number(source.steps)}
                    </Label>
                  ))}
                </Stack>,
              ],
            }))}
          empty="No source places a step in any hour of this day."
        />
      </Panel>

      {view === 'runs' ? (
        <Panel
          title={overlapsOnly ? 'The overlapping stretches' : 'Stretches of walking'}
          subtitle="Contiguous minutes that went to the same phone. A ✕ is a phone whose steps were dropped across the stretch because another phone was counting the same minutes."
        >
          <DataTable
            columns={[
              { label: 'From → to', width: 200 },
              { label: 'Length', align: 'right' },
              { label: 'Counted', align: 'right' },
              { label: 'Dropped', align: 'right' },
              { label: 'Taken from' },
              { label: 'Also counting' },
            ]}
            rows={runRows}
            empty={
              overlapsOnly
                ? 'No minute of this day was claimed by more than one phone.'
                : 'No minute of this day carried steps.'
            }
          />
        </Panel>
      ) : (
        <Panel
          title={overlapsOnly ? 'The overlapping minutes' : 'Every minute with steps'}
          subtitle="A ✕ is a phone whose steps were dropped for that minute because another phone claimed it."
          note={answer.data.truncated ? 'The day had more minutes than the API would return in one call.' : undefined}
        >
          <DataTable
            columns={[
              { label: 'Minute', width: 220 },
              { label: 'Local' },
              { label: 'Counted', align: 'right' },
              { label: 'Dropped', align: 'right' },
              { label: 'Claimed by' },
            ]}
            rows={minuteRows}
            empty={overlapsOnly ? 'No minute of this day was claimed by more than one phone.' : 'No minute of this day carried steps.'}
          />
          <OffsetPager total={rows.length} offset={offset} limit={limit} />
        </Panel>
      )}
    </Stack>
  );
}
