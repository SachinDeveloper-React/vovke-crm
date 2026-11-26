import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Kv, PageHeader, Panel, TextLink } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, dateTime } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';

import { STATUS_COLORS, STATUS_LABELS } from './enquiries-view';
import { DeleteEnquiryButton, EnquiryReplyForm, EnquiryStatusForm } from './enquiry-forms';
import type { EnquiryDetail } from './types';

/** One message from the contact form: what they wrote, who they are, what we did about it. */
export async function EnquiryView({ id }: { id: string }) {
  const enquiry = await adminGet<EnquiryDetail>(`/admin/site/enquiries/${encodeURIComponent(id)}`);

  return (
    <Stack>
      <PageHeader
        title={enquiry.topic ? `${enquiry.name} · ${enquiry.topic}` : enquiry.name}
        subtitle={`Sent from the website ${ago(enquiry.createdAt)}.`}
        action={<DeleteEnquiryButton id={enquiry.id} />}
      />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <Panel
              title="What they wrote"
              action={<Chip size="small" color={STATUS_COLORS[enquiry.status]} label={STATUS_LABELS[enquiry.status]} />}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {enquiry.message}
              </Typography>
            </Panel>

            <Panel title="Answers" subtitle="What the team told them, newest last. An answer sent from here goes by email, with replies coming back to the support address.">
              <Stack spacing={2}>
                {enquiry.replies.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    Nobody has answered yet.
                  </Typography>
                ) : (
                  enquiry.replies.map(reply => (
                    <Box key={reply.id} sx={{ borderLeft: 3, borderColor: reply.via === 'sent' ? 'success.main' : 'divider', pl: 2 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {reply.via === 'sent' ? 'Emailed' : 'Logged (answered elsewhere)'} · {dateTime(reply.at)} · {reply.by}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                        {reply.body}
                      </Typography>
                    </Box>
                  ))
                )}
                <EnquiryReplyForm id={enquiry.id} name={enquiry.name} emailConfigured={enquiry.emailConfigured} disabled={enquiry.status === 'spam'} />
              </Stack>
            </Panel>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Panel title="Who">
              <Box>
                <Kv
                  items={[
                    { label: 'Name', value: enquiry.name },
                    { label: 'Email', value: <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a> },
                    { label: 'Phone', value: enquiry.phone ?? '—' },
                    {
                      label: 'Member',
                      value: enquiry.userId ? (
                        <TextLink href={paths.dashboard.users.detail(enquiry.userId)}>Open their account</TextLink>
                      ) : (
                        'No account with this email'
                      ),
                    },
                    { label: 'Received', value: dateTime(enquiry.createdAt) },
                    { label: 'From page', value: enquiry.page ?? '—' },
                    { label: 'Handled by', value: enquiry.handledBy ?? 'Nobody yet' },
                  ]}
                />
              </Box>
            </Panel>

            <Panel title="State and note" subtitle="The note is the team’s own — never sent to them.">
              <Box>
                <EnquiryStatusForm id={enquiry.id} status={enquiry.status} note={enquiry.note} />
              </Box>
            </Panel>

            {enquiry.earlier.length > 0 && (
              <Panel title="Earlier from this address">
                <Stack spacing={1}>
                  {enquiry.earlier.map(other => (
                    <Stack key={other.id} direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <TextLink href={paths.dashboard.website.enquiry(other.id)}>{other.topic ?? 'No topic'}</TextLink>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {STATUS_LABELS[other.status]} · {ago(other.createdAt)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Panel>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
