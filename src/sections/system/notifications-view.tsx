import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  DataTable,
  DaysFilter,
  FilterBar,
  LinkButton,
  Mono,
  OffsetPager,
  Panel,
  RowLink,
  SearchFilter,
  SelectFilter,
  Stat,
} from '@/src/components/ui';
import { adminGet, adminTry } from '@/src/lib/api';
import { ago, compact, dateTime, humanise, number, percent } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { Broadcasts, NotificationConsent, Notifications } from '@/src/lib/types';

import { DeleteNotification, RetractBroadcast } from './notification-forms';

export type NotificationsQuery = {
  q: string;
  topic: string;
  state: string;
  days: number;
  limit: number;
  offset: number;
};

const TOPICS = [
  'steps',
  'workout',
  'streak',
  'hydration',
  'coins',
  'challenge',
  'reward',
  'health',
  'system',
] as const;

const CATEGORY_TONE: Record<string, 'info' | 'warning' | 'default'> = {
  activity: 'info',
  reward: 'warning',
  system: 'default',
};

/**
 * What the app has actually told everybody (ARCHITECTURE §5.7).
 *
 * The feed row is written always and the push follows the member's consent,
 * so every row here says which of the two happened — and the three figures
 * that matter are counted across the filter rather than the page:
 *
 *   - **read** is the only honest measure of a message nobody was pushed;
 *   - **held** is a push quiet hours still have, which is the one state
 *     with something left to happen in it — and the one thing deleting a
 *     row can still cancel;
 *   - **not pushed** is a feed row with no push at all: the category was
 *     switched off, or no phone on the account could have shown it.
 *
 * Nothing on this page sends anything. Sending is Messages, and `notify()`
 * is the only path to a push — there is no bypass, including from here.
 */
export async function NotificationsView({ query }: { query: NotificationsQuery }) {
  const [feed, broadcasts, consent] = await Promise.all([
    adminGet<Notifications>('/admin/notifications', {
      q: query.q,
      topic: query.topic || undefined,
      state: query.state || 'any',
      days: query.days,
      limit: query.limit,
      offset: query.offset,
    }),
    adminTry<Broadcasts>('/admin/notifications/broadcasts', { limit: 25 }),
    adminTry<NotificationConsent>('/admin/notifications/consent'),
  ]);
  const { totals, byTopic, data } = feed;

  const quietest = [...byTopic].sort((a, b) => a.read / Math.max(1, a.sent) - b.read / Math.max(1, b.sent))[0];

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Sent"
            value={compact(totals.sent)}
            icon="solar:bell-bing-bold-duotone"
            goodDirection="none"
            hint={`in ${number(feed.window.days)} days`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Read"
            value={totals.sent > 0 ? percent(totals.read / totals.sent, 0) : '—'}
            icon="solar:eye-bold-duotone"
            goodDirection="up"
            hint={`${compact(totals.read)} opened · ${compact(totals.unread)} not`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Pushed"
            value={compact(totals.pushed)}
            icon="solar:iphone-bold-duotone"
            goodDirection="none"
            hint={`${compact(totals.notPushed)} feed-only — category off, or no phone that could show it`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Pushes held"
            value={number(totals.deferred)}
            icon="solar:moon-sleep-bold-duotone"
            goodDirection="none"
            hint="waiting for quiet hours to end — the hourly tick sends these"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Panel
            title="By subject"
            subtitle={quietest && quietest.sent > 0 ? `${quietest.topic} is read least` : undefined}
            note="The three categories are the member's own filter: activity, reward, system. A switch is per subject, so a quiet subject is usually a switched-off one rather than an ignored one."
            dense
          >
            <DataTable
              columns={[{ label: 'Subject' }, { label: 'Sent', align: 'right' }, { label: 'Read', align: 'right' }]}
              rows={byTopic.map(row => ({
                key: row.topic,
                cells: [
                  <Stack key="topic" direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <Typography variant="subtitle2">{row.topic}</Typography>
                    <Label color={CATEGORY_TONE[row.category] ?? 'default'} variant="soft">
                      {row.category}
                    </Label>
                  </Stack>,
                  <Typography key="sent" variant="body2" sx={{ textAlign: 'right' }}>
                    {number(row.sent)}
                  </Typography>,
                  <Stack key="read" spacing={0.25} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2">{number(row.read)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {percent(row.read / Math.max(1, row.sent), 0)}
                    </Typography>
                  </Stack>,
                ],
              }))}
              empty="Nothing has been sent in this window."
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel
            title="Per day"
            subtitle="Sends, oldest first"
            action={
              <LinkButton href={paths.dashboard.messages} size="small" variant="outlined">
                Tell a segment
              </LinkButton>
            }
            dense
          >
            <DataTable
              columns={[{ label: 'Day' }, { label: 'Sent', align: 'right' }]}
              rows={feed.byDay.map(row => ({
                key: row.day,
                cells: [
                  <Typography key="day" variant="body2">
                    {row.day}
                  </Typography>,
                  <Typography key="sent" variant="body2" sx={{ textAlign: 'right' }}>
                    {number(row.sent)}
                  </Typography>,
                ],
              }))}
              empty="Nothing yet."
            />
          </Panel>
        </Grid>
      </Grid>

      {'data' in consent && (
        <Panel
          title="What members have agreed to hear"
          subtitle={`${number(consent.data.members)} accounts · the switch decides whether a push is sent at all`}
          note="A preferences row is written at sign-up, so a member sitting on the default has refused nothing — “chose it” is the figure that separates a decision from a default. Consent is only ever given in the app: it can be switched off from a member's own tab and never back on. Every switch still writes the feed row; only the push is withheld."
          dense
        >
          <DataTable
            columns={[
              { label: 'Subject' },
              { label: 'Sent on it' },
              { label: 'Reaches', align: 'right' },
              { label: 'Switched off', align: 'right' },
              { label: 'Chose it', align: 'right' },
            ]}
            rows={consent.data.switches.map(row => ({
              key: row.key,
              cells: [
                <Stack key="key" spacing={0.25}>
                  <Typography variant="subtitle2">{humanise(row.key)}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {row.defaultOn ? 'on by default' : 'off until asked for'}
                  </Typography>
                </Stack>,
                row.governs.length > 0 ? (
                  <Stack key="governs" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {row.governs.map(topic => (
                      <Label key={topic} color="default" variant="soft">
                        {topic}
                      </Label>
                    ))}
                  </Stack>
                ) : (
                  // A switch no topic maps to silences nothing unless the
                  // sender names it. Worth saying outright: a column of
                  // refusals against it would otherwise read as lost reach.
                  <Label key="governs" color="warning" variant="soft">
                    only when a send names it
                  </Label>
                ),
                <Typography key="on" variant="body2" sx={{ textAlign: 'right' }}>
                  {number(row.on)}
                </Typography>,
                <Stack key="off" spacing={0.25} sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">{number(row.off)}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {percent(row.off / Math.max(1, consent.data.members), 0)}
                  </Typography>
                </Stack>,
                <Stack key="chosen" spacing={0.5} sx={{ alignItems: 'flex-end' }}>
                  <Typography variant="body2">{number(row.chosen)}</Typography>
                  {row.chosen > 0 && (
                    <LinkButton
                      href={`${paths.dashboard.users.root}?silenced=${row.key}`}
                      size="small"
                      color="inherit"
                      variant="outlined"
                    >
                      Who
                    </LinkButton>
                  )}
                </Stack>,
              ],
            }))}
            empty="No account has a preferences row yet."
          />
          <Stack direction="row" spacing={3} sx={{ px: 3, pt: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Quiet hours on: <strong>{number(consent.data.quietHours.on)}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Order texts on: <strong>{number(consent.data.channels.sms.on)}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Email on: <strong>{number(consent.data.channels.email.on)}</strong>
            </Typography>
          </Stack>
        </Panel>
      )}

      {'data' in broadcasts && broadcasts.data.data.length > 0 && (
        <Panel
          title="Broadcasts"
          subtitle="What was sent to a segment, and what became of it"
          note="The tally on the left is what the send itself reported; the open rate on the right is what it could not know. A retraction removes only the rows nobody has opened."
          dense
        >
          <DataTable
            columns={[
              { label: 'Message' },
              { label: 'Sent' },
              { label: 'Opened', align: 'right' },
              { label: 'Take it back', width: 300 },
            ]}
            rows={broadcasts.data.data.map(row => ({
              key: row.id,
              cells: [
                <Stack key="message" spacing={0.25} sx={{ maxWidth: 360 }}>
                  <Typography variant="subtitle2">{row.title}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {row.message}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    <Label color="default" variant="soft">
                      {row.topic}
                    </Label>
                    {Object.entries(row.segment).map(([key, value]) => (
                      <Label key={key} color="info" variant="soft">
                        {key}: {String(value)}
                      </Label>
                    ))}
                  </Stack>
                  {row.reason && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      “{row.reason}” · {row.actorId ?? 'unknown'}
                    </Typography>
                  )}
                </Stack>,
                <Stack key="sent" spacing={0.25}>
                  <Typography variant="body2">{number(row.sent.recipients)} members</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {number(row.sent.pushed)} pushed · {number(row.sent.notPushed)} feed-only
                    {row.sent.deferred > 0 ? ` · ${number(row.sent.deferred)} held` : ''}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {dateTime(row.at)}
                  </Typography>
                </Stack>,
                <Stack key="open" spacing={0.25} sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2">{percent(row.live.openRate, 0)}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {number(row.live.read)} of {number(row.live.rows)} left
                  </Typography>
                </Stack>,
                <RetractBroadcast key="retract" dedupeKey={row.id} retractable={row.retractable} read={row.live.read} />,
              ],
            }))}
            empty="No broadcast has been sent."
          />
        </Panel>
      )}

      <FilterBar>
        <SearchFilter value={query.q} placeholder="Words, or a member" />
        <SelectFilter
          label="Subject"
          param="topic"
          value={query.topic}
          options={[{ value: '', label: 'Every subject' }, ...TOPICS.map(topic => ({ value: topic, label: topic }))]}
          width={160}
        />
        <SelectFilter
          label="State"
          param="state"
          value={query.state}
          options={[
            { value: 'any', label: 'Everything' },
            { value: 'unread', label: 'Not read' },
            { value: 'read', label: 'Read' },
            { value: 'pushed', label: 'Pushed' },
            { value: 'deferred', label: 'Push held' },
            { value: 'not_pushed', label: 'Feed only' },
          ]}
          width={160}
        />
        <DaysFilter value={query.days} options={[1, 7, 30, 90]} />
        <SelectFilter
          label="Rows"
          param="limit"
          value={String(query.limit)}
          options={[25, 50, 100].map(option => ({ value: String(option), label: `${option} rows` }))}
          width={120}
        />
      </FilterBar>

      <Panel
        title={`${compact(feed.total)} notification${feed.total === 1 ? '' : 's'}`}
        subtitle={query.q ? `matching “${query.q}”` : `the last ${number(feed.window.days)} days`}
        dense
      >
        <DataTable
          columns={[
            { label: 'Member' },
            { label: 'What it said' },
            { label: 'Subject' },
            { label: 'Where it went' },
            { label: 'Remove it', width: 250 },
          ]}
          rows={data.map(row => ({
            key: row.id,
            tone: row.pushPending ? 'danger' : 'default',
            cells: [
              <RowLink
                key="member"
                href={{ pathname: paths.dashboard.users.config(row.member.id) }}
                secondary={row.member.email ?? row.member.id}
              >
                {row.member.name || row.member.id}
              </RowLink>,
              <Stack key="said" spacing={0.25} sx={{ maxWidth: 360 }}>
                <Typography variant="subtitle2">{row.title}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {row.message}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {ago(row.createdAt)}
                  {row.dedupeKey ? ' · part of a send' : ''}
                </Typography>
              </Stack>,
              <Stack key="topic" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                <Label color="default" variant="soft">
                  {row.topic}
                </Label>
                <Label color={CATEGORY_TONE[row.category] ?? 'default'} variant="soft">
                  {row.category}
                </Label>
              </Stack>,
              <Stack key="where" spacing={0.25}>
                {row.pushPending ? (
                  <Label color="warning" variant="soft">
                    push held until {dateTime(row.pushDeferredUntil)}
                  </Label>
                ) : row.pushedAt ? (
                  <Label color="success" variant="soft">
                    pushed {ago(row.pushedAt)}
                  </Label>
                ) : (
                  <Label color="default" variant="soft">
                    feed only
                  </Label>
                )}
                {row.read ? (
                  <Typography variant="caption" sx={{ color: 'success.main' }}>
                    read {ago(row.readAt)}
                  </Typography>
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    not read
                  </Typography>
                )}
              </Stack>,
              <DeleteNotification key="delete" id={row.id} pushPending={row.pushPending} />,
            ],
          }))}
          empty={query.q || query.state !== 'any' ? 'Nothing matches those filters.' : 'Nothing has been sent in this window.'}
        />
        <OffsetPager total={feed.total} offset={feed.offset} limit={feed.limit} />
      </Panel>

      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        A member’s own switches decide the push, never the feed row: <Mono>notify()</Mono> writes the row first and
        always — it is the channel they can go and look at — then the category switch decides whether a push follows and
        quiet hours decide when. Which is why “feed only” is a consent outcome rather than a failure.
      </Typography>
    </Stack>
  );
}
