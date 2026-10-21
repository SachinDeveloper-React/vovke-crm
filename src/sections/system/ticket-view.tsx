import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { DataTable, Kv, LinkButton, Mono, Panel, RowLink, TrustChip } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, dateTime, hours, number } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { TicketDetail } from '@/src/lib/types';

import { DeleteTicket, ReplyForm, StatusForm } from './support-forms';
import { TICKET_TONE } from './support-view';

/**
 * One conversation, and the two things that make it answerable.
 *
 * The thread is the page, but the thread alone is not enough to answer with:
 * the phone's own details ride along on the ticket — the first thing support
 * asks and the last thing a member wants to type — and their other tickets
 * are beside it, because the same question twice is a different problem from
 * the same question once.
 */
export async function TicketView({ ticketId }: { ticketId: string }) {
  const detail = await adminGet<TicketDetail>(`/admin/support/tickets/${encodeURIComponent(ticketId)}`);
  const { ticket, member, otherTickets } = detail;

  const answered = ticket.messages.some(message => message.from === 'support');

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">
          <Mono>{ticket.reference}</Mono>
        </Typography>
        <Label color={TICKET_TONE[ticket.status]} variant="soft">
          {ticket.status.replace(/_/g, ' ')}
        </Label>
        <Label color="default" variant="soft">
          {ticket.category}
        </Label>
        {ticket.waitingOnUs && (
          <Label color={ticket.waitingHours > 24 ? 'error' : 'warning'} variant="soft">
            waiting on us · {hours(ticket.waitingHours)}
          </Label>
        )}
        <LinkButton href={paths.dashboard.support} size="small" color="inherit" variant="outlined">
          The queue
        </LinkButton>
      </Stack>

      <Typography variant="h6">{ticket.subject}</Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Panel
            title={`${number(ticket.messages.length)} message${ticket.messages.length === 1 ? '' : 's'}`}
            subtitle={`opened ${dateTime(ticket.createdAt)}`}
          >
            <Stack spacing={2}>
              {ticket.messages.map(message => {
                const mine = message.from === 'support';
                return (
                  <Box
                    key={message.id}
                    sx={{
                      alignSelf: mine ? 'flex-end' : 'flex-start',
                      maxWidth: { xs: '100%', sm: '85%' },
                      p: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: mine ? 'primary.main' : 'divider',
                      // The member's words plain, ours tinted: at a glance the
                      // thread reads as a conversation rather than a log.
                      bgcolor: mine ? 'color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent)' : 'transparent',
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: mine ? 'primary.main' : 'text.secondary', fontWeight: 600 }}>
                        {mine ? 'Support' : member.name || 'The member'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {dateTime(message.createdAt)}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.body}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <Panel title="Who asked" subtitle="And on what">
              <Kv
                items={[
                  {
                    label: 'Member',
                    value: (
                      <RowLink href={{ pathname: paths.dashboard.users.detail(member.id) }}>
                        {member.name || member.id}
                      </RowLink>
                    ),
                  },
                  { label: 'Email', value: member.email ?? '—' },
                  { label: 'Phone', value: member.phone ?? '—' },
                  { label: 'Trust', value: member.tier ? <TrustChip tier={member.tier} score={null} /> : '—' },
                  { label: 'With us since', value: dateTime(member.since) },
                  {
                    label: 'Their phone',
                    value: [ticket.context.platform, ticket.context.osVersion].filter(Boolean).join(' ') || '—',
                    hint: 'as it was when they opened the ticket',
                  },
                  { label: 'App build', value: ticket.context.appVersion ?? '—' },
                  {
                    label: 'Device',
                    value: ticket.context.deviceId ? <Mono>{ticket.context.deviceId}</Mono> : '—',
                  },
                ]}
              />
            </Panel>

            <Panel title="Move it" subtitle="Without saying anything in the thread">
              <StatusForm id={ticket.id} status={ticket.status} />
            </Panel>
          </Stack>
        </Grid>
      </Grid>

      <Panel
        title="Answer them"
        subtitle={ticket.waitingOnUs ? `They have been waiting ${hours(ticket.waitingHours)}` : 'The last word was ours'}
      >
        <ReplyForm id={ticket.id} status={ticket.status} closed={ticket.status === 'closed'} />
      </Panel>

      {otherTickets.length > 0 && (
        <Panel
          title={`${number(otherTickets.length)} other ticket${otherTickets.length === 1 ? '' : 's'} from them`}
          subtitle="The same question twice is a different problem"
          dense
        >
          <DataTable
            columns={[{ label: 'Ticket' }, { label: 'State' }, { label: 'Opened' }]}
            rows={otherTickets.map(other => ({
              key: other.id,
              cells: [
                <RowLink key="ref" href={{ pathname: paths.dashboard.ticket(other.id) }} secondary={other.subject}>
                  <Mono>{other.reference}</Mono>
                </RowLink>,
                <Label key="state" color={TICKET_TONE[other.status]} variant="soft">
                  {other.status.replace(/_/g, ' ')}
                </Label>,
                <Typography key="at" variant="caption" sx={{ color: 'text.secondary' }}>
                  {ago(other.createdAt)}
                </Typography>,
              ],
            }))}
            empty="None."
          />
        </Panel>
      )}

      <Panel title="Delete it" subtitle="Spam, or a duplicate — not the way to end a conversation">
        <DeleteTicket id={ticket.id} reference={ticket.reference} answered={answered} />
      </Panel>
    </Stack>
  );
}
