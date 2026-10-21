import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ColumnChart, RankedBars } from '@/src/components/charts';
import { CursorPager, DataTable, Evidence, FilterBar, Mono, Panel, SearchFilter, SelectFilter, Stat } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, dateTime, humanise, number } from '@/src/lib/format';
import type { Page, TrailRow, TrailSummary } from '@/src/lib/types';

/**
 * Where they have been and what they did, as the app reported it.
 *
 * Two readings of the same rows: the shape — which screens, how often, how
 * many visits, bucketed in *their* timezone — and the list itself, newest
 * first. The list is cursored on a time-ordered id, so a page cannot shift
 * under a reader while rows arrive.
 */
export async function MemberTrail({
  userId,
  days,
  limit,
  cursor,
  name,
  screen,
}: {
  userId: string;
  days: number;
  limit: number;
  cursor: string;
  name: string;
  screen: string;
}) {
  const base = `/admin/users/${encodeURIComponent(userId)}`;
  const [summary, trail] = await Promise.all([
    adminGet<TrailSummary>(`${base}/activity/summary`, { days }),
    adminGet<Page<TrailRow>>(`${base}/activity`, { limit, cursor: cursor || undefined, name: name || undefined, screen: screen || undefined }),
  ]);

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat label={`Events in ${days}d`} value={number(summary.events)} icon="solar:document-text-bold-duotone" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat label="Visits" value={number(summary.sessions)} icon="solar:play-circle-bold-duotone" hint="App launches that sent a session id" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat label="First event" value={ago(summary.firstAt)} icon="solar:history-bold-duotone" hint={dateTime(summary.firstAt)} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat label="Last event" value={ago(summary.lastAt)} icon="solar:clock-circle-bold-duotone" hint={dateTime(summary.lastAt)} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel
            title="Events a day"
            subtitle={`Bucketed in ${summary.timezone} — their day, not ours`}
            action={<SelectFilter label="Window" param="days" value={String(days)} options={[7, 14, 30, 90].map(d => ({ value: String(d), label: `${d} days` }))} width={120} />}
          >
            <ColumnChart
              data={summary.byDay.map(day => ({ date: day.date, events: day.events, screens: day.screens }))}
              series={[{ key: 'events', label: 'Events' }]}
              valueFormat="number"
              ariaLabel="Events per day"
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Panel title="Screens they open">
            <RankedBars
              items={summary.screens.slice(0, 10).map(row => ({ label: row.screen, value: row.views, hint: ago(row.lastAt) }))}
              emptyText="No screen view in this window."
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Panel title="What they do">
            <RankedBars
              items={summary.actions.slice(0, 10).map(row => ({ label: humanise(row.name), value: row.count, hint: ago(row.lastAt) }))}
              emptyText="No action in this window."
            />
          </Panel>
        </Grid>
      </Grid>

      <Panel
        title="The trail itself"
        subtitle="Newest first"
        note="`at` is the phone's clock — events queue offline and can arrive hours late — and the received time is ours."
        action={
          <FilterBar>
            <SearchFilter value={name} param="name" placeholder="Event name, e.g. order_paid" />
            <SearchFilter value={screen} param="screen" placeholder="Screen, e.g. Checkout" />
          </FilterBar>
        }
        dense
      >
        <DataTable
          columns={[
            { label: 'When' },
            { label: 'Event' },
            { label: 'Screen' },
            { label: 'Build' },
            { label: 'Props' },
          ]}
          rows={trail.data.map(row => ({
            key: row.id,
            cells: [
              <Stack key="at" spacing={0.25}>
                <Typography variant="body2">{dateTime(row.at)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {ago(row.at)}
                  {row.receivedAt !== row.at ? ` · received ${ago(row.receivedAt)}` : ''}
                </Typography>
              </Stack>,
              <Stack key="name" spacing={0.25}>
                <Typography variant="subtitle2">{humanise(row.name)}</Typography>
                <Mono>{row.name}</Mono>
              </Stack>,
              row.screen ?? '—',
              <Stack key="build" spacing={0.25}>
                <Typography variant="body2">{row.appVersion ?? '—'}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {row.platform ?? '—'} · {row.sessionId ? `visit ${row.sessionId.slice(0, 8)}` : 'no session id'}
                </Typography>
              </Stack>,
              row.props && Object.keys(row.props).length > 0 ? (
                <Box key="props" sx={{ maxWidth: 320 }}>
                  <Evidence data={row.props} label="" />
                </Box>
              ) : (
                '—'
              ),
            ],
          }))}
          empty={name || screen ? 'Nothing in the trail matches that filter.' : 'This account has no trail — either nothing has been done yet, or usage analytics is switched off.'}
        />
        <CursorPager next={trail.nextCursor} cursor={cursor} />
      </Panel>
    </Stack>
  );
}
