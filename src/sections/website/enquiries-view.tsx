import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DataTable, FilterBar, OffsetPager, Panel, SearchFilter, SelectFilter, Stat, TextLink } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';

import type { EnquiryList, EnquiryStatus } from './types';

export const ENQUIRY_FILTERS = ['waiting', 'any', 'new', 'open', 'replied', 'closed', 'spam'] as const;
export type EnquiryFilter = (typeof ENQUIRY_FILTERS)[number];

export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: 'New',
  open: 'Being handled',
  replied: 'Answered',
  closed: 'Closed',
  spam: 'Spam',
};

export const STATUS_COLORS: Record<EnquiryStatus, 'error' | 'warning' | 'success' | 'default' | 'info'> = {
  new: 'error',
  open: 'warning',
  replied: 'success',
  closed: 'default',
  spam: 'default',
};

/**
 * Messages from the website's contact form (RULES P22), waiting ones first.
 * Not support tickets — most senders are not members — but where the address
 * is a member's, the row says so and the message links to their account.
 */
export async function EnquiriesView({
  query,
}: {
  query: { status: EnquiryFilter; q: string; limit: number; offset: number };
}) {
  const list = await adminGet<EnquiryList>('/admin/site/enquiries', query);

  return (
    <Stack spacing={3}>
      {!list.emailConfigured && (
        <Alert severity="info" variant="outlined">
          Email is not set up on the API, so answers cannot be sent from here. Reply from the support mailbox and log the answer on
          the message so the team can see it was handled.
        </Alert>
      )}

      <Grid container spacing={3}>
        {(['new', 'open', 'replied', 'spam'] as const).map(status => (
          <Grid key={status} size={{ xs: 6, md: 3 }}>
            <Stat label={STATUS_LABELS[status]} value={String(list.counts[status] ?? 0)} goodDirection="none" icon="solar:inbox-line-bold-duotone" />
          </Grid>
        ))}
      </Grid>

      <Panel title="Messages" subtitle="Newest first. “Waiting” is new and being handled.">
        <FilterBar>
          <SearchFilter value={query.q} placeholder="Name, email, words in the message" />
          <SelectFilter
            label="Show"
            param="status"
            value={query.status}
            options={[
              { value: 'waiting', label: 'Waiting' },
              { value: 'any', label: 'Everything' },
              ...(['new', 'open', 'replied', 'closed', 'spam'] as const).map(status => ({ value: status, label: STATUS_LABELS[status] })),
            ]}
          />
        </FilterBar>
        <DataTable
          columns={[{ label: 'From' }, { label: 'About' }, { label: 'Message' }, { label: 'State' }, { label: 'Received' }]}
          empty={query.status === 'waiting' ? 'Nobody is waiting for an answer.' : 'No messages match.'}
          rows={list.data.map(enquiry => ({
            key: enquiry.id,
            tone: enquiry.status === 'new' ? 'danger' : 'default',
            cells: [
              <Stack key="from" spacing={0.25}>
                <TextLink href={paths.dashboard.website.enquiry(enquiry.id)} variant="subtitle2">
                  {enquiry.name}
                </TextLink>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {enquiry.email}
                  {enquiry.userId ? ' · member' : ''}
                </Typography>
              </Stack>,
              <Typography key="topic" variant="body2">
                {enquiry.topic ?? '—'}
              </Typography>,
              <Typography
                key="message"
                variant="body2"
                sx={{ color: 'text.secondary', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {enquiry.message}
              </Typography>,
              <Chip key="state" size="small" color={STATUS_COLORS[enquiry.status]} variant={enquiry.status === 'new' ? 'filled' : 'outlined'} label={STATUS_LABELS[enquiry.status]} />,
              <Typography key="at" variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                {ago(enquiry.createdAt)}
              </Typography>,
            ],
          }))}
        />
        <OffsetPager total={list.total} offset={list.offset} limit={list.limit} />
      </Panel>
    </Stack>
  );
}
