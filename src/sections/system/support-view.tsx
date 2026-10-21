import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import {
  DataTable,
  FilterBar,
  Mono,
  OffsetPager,
  Panel,
  RowLink,
  SearchFilter,
  SelectFilter,
  Stat,
  TextLink,
} from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, hours, number } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { TicketStatus, Tickets } from '@/src/lib/types';

export type SupportQuery = {
  q: string;
  status: string;
  category: string;
  waiting: string;
  sort: string;
  limit: number;
  offset: number;
};

export const TICKET_TONE: Record<TicketStatus, 'warning' | 'info' | 'success' | 'default'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'default',
};

const CATEGORIES = ['account', 'coins', 'orders', 'tracking', 'payments', 'privacy', 'other'] as const;

/**
 * The support queue (RULES P12).
 *
 * Ordered by **who has been waiting for us**, not by what is open: a ticket
 * whose last message is the member's is ours to answer, and one where we
 * answered last is waiting on them. That distinction is computed from the
 * thread rather than stored, so it cannot drift from what the thread says —
 * and it is the only ordering that puts the oldest unanswered question at
 * the top, which is the one doing damage.
 */
export async function SupportView({ query }: { query: SupportQuery }) {
  const tickets = await adminGet<Tickets>('/admin/support/tickets', {
    q: query.q,
    status: query.status || 'any',
    category: query.category || undefined,
    waiting: query.waiting || 'any',
    sort: query.sort,
    limit: query.limit,
    offset: query.offset,
  });
  const { totals, byStatus, byCategory, data } = tickets;

  const open = byStatus.find(row => row.status === 'open')?.tickets ?? 0;
  const inProgress = byStatus.find(row => row.status === 'in_progress')?.tickets ?? 0;
  const loudest = byCategory[0];

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Waiting on us"
            value={number(totals.waitingOnUs)}
            icon="solar:chat-round-dots-bold-duotone"
            goodDirection="down"
            hint="their word was the last one"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Longest wait"
            value={totals.oldestWaitHours > 0 ? hours(totals.oldestWaitHours) : '—'}
            icon="solar:clock-circle-bold-duotone"
            goodDirection="down"
            hint={totals.oldestWaitReference ?? 'nothing unanswered'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Open"
            value={number(open + inProgress)}
            icon="solar:folder-open-bold-duotone"
            goodDirection="none"
            hint={`${number(open)} untouched · ${number(inProgress)} in progress`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Most asked about"
            value={loudest?.category ?? '—'}
            icon="solar:question-circle-bold-duotone"
            goodDirection="none"
            hint={loudest ? `${number(loudest.tickets)} open ticket(s)` : 'nothing open'}
          />
        </Grid>
      </Grid>

      <Panel
        title="What they are asking about"
        subtitle="Open and in-progress only — a closed ticket is not a subject needing help"
        note="A category with a wave of tickets in it is usually an article waiting to be written: the help centre's own shelves are the same list."
        dense
      >
        <DataTable
          columns={[{ label: 'Subject' }, { label: 'Open tickets', align: 'right' }, { label: '' }]}
          rows={byCategory.map(row => ({
            key: row.category,
            cells: [
              <Typography key="category" variant="subtitle2">
                {row.category}
              </Typography>,
              <Typography key="count" variant="body2" sx={{ textAlign: 'right' }}>
                {number(row.tickets)}
              </Typography>,
              <TextLink key="write" href={{ pathname: paths.dashboard.faq, query: { category: row.category } }}>
                Answer it in the help centre
              </TextLink>,
            ],
          }))}
          empty="Nothing is open."
        />
      </Panel>

      <FilterBar>
        <SearchFilter value={query.q} placeholder="Reference, subject, words, or a member" />
        <SelectFilter
          label="Waiting on"
          param="waiting"
          value={query.waiting}
          options={[
            { value: 'any', label: 'Either side' },
            { value: 'us', label: 'Us' },
            { value: 'them', label: 'Them' },
          ]}
          width={150}
        />
        <SelectFilter
          label="State"
          param="status"
          value={query.status}
          options={[
            { value: 'any', label: 'Every state' },
            { value: 'open', label: 'Open' },
            { value: 'in_progress', label: 'In progress' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'closed', label: 'Closed' },
          ]}
          width={160}
        />
        <SelectFilter
          label="Subject"
          param="category"
          value={query.category}
          options={[
            { value: '', label: 'Every subject' },
            ...CATEGORIES.map(category => ({ value: category, label: category })),
          ]}
          width={150}
        />
        <SelectFilter
          label="Sort"
          param="sort"
          value={query.sort}
          options={[
            { value: 'waiting', label: 'Longest wait' },
            { value: 'updated', label: 'Last touched' },
            { value: 'newest', label: 'Newest' },
            { value: 'oldest', label: 'Oldest' },
          ]}
          width={160}
        />
        <SelectFilter
          label="Rows"
          param="limit"
          value={String(query.limit)}
          options={[25, 50, 100].map(option => ({ value: String(option), label: `${option} rows` }))}
          width={120}
        />
      </FilterBar>

      <Panel
        title={`${number(tickets.total)} ticket${tickets.total === 1 ? '' : 's'}`}
        subtitle={query.q ? `matching “${query.q}”` : query.sort === 'waiting' ? 'ours to answer first, longest wait at the top' : undefined}
        dense
      >
        <DataTable
          columns={[
            { label: 'Ticket' },
            { label: 'Member' },
            { label: 'State' },
            { label: 'Last word' },
            { label: 'Waiting' },
          ]}
          rows={data.map(row => ({
            key: row.id,
            tone: row.waitingOnUs && row.waitingHours > 24 ? 'danger' : 'default',
            cells: [
              <Stack key="ticket" spacing={0.25}>
                <RowLink href={{ pathname: paths.dashboard.ticket(row.id) }} secondary={row.subject}>
                  <Mono>{row.reference}</Mono>
                </RowLink>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <Label color="default" variant="soft">
                    {row.category}
                  </Label>
                  {row.platform && (
                    <Label color="default" variant="soft">
                      {row.platform} {row.appVersion ?? ''}
                    </Label>
                  )}
                </Stack>
              </Stack>,
              <RowLink
                key="member"
                href={{ pathname: paths.dashboard.users.detail(row.member.id) }}
                secondary={row.member.email ?? row.member.phone ?? undefined}
              >
                {row.member.name || row.member.id}
              </RowLink>,
              <Label key="state" color={TICKET_TONE[row.status]} variant="soft">
                {row.status.replace(/_/g, ' ')}
              </Label>,
              <Stack key="last" spacing={0.25} sx={{ maxWidth: 320 }}>
                <Typography variant="caption" sx={{ color: row.lastFrom === 'user' ? 'text.primary' : 'text.secondary' }}>
                  {row.lastFrom === 'user' ? 'They said' : 'We said'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {row.lastMessage.length > 140 ? `${row.lastMessage.slice(0, 137)}…` : row.lastMessage}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {ago(row.lastAt)} · {number(row.messages)} message(s)
                </Typography>
              </Stack>,
              <Stack key="waiting" spacing={0.25}>
                {row.waitingOnUs ? (
                  <Label color={row.waitingHours > 24 ? 'error' : 'warning'} variant="soft">
                    us · {hours(row.waitingHours)}
                  </Label>
                ) : (
                  <Label color="default" variant="soft">
                    them
                  </Label>
                )}
              </Stack>,
            ],
          }))}
          empty={query.q || query.status !== 'any' ? 'Nothing matches those filters.' : 'Nobody has opened a ticket.'}
        />
        <OffsetPager total={tickets.total} offset={tickets.offset} limit={tickets.limit} />
      </Panel>

      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        “Waiting on us” is read off the thread’s last message rather than stored, so it cannot disagree with the
        conversation. The wait filters and that sort are applied to the newest five hundred tickets the other filters
        matched — the state filters are the way to a smaller, exact set.
      </Typography>
    </Stack>
  );
}
