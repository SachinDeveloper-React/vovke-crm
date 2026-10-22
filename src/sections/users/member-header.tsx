import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { Label } from '@/src/components/label';
import { LinkButton, Mono, SectionGuide, TrustChip } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, coins, number, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { UserOverview } from '@/src/lib/types';

import { MemberTabs } from './member-tabs';

/**
 * Who this is, across every tab: the account, the state it is in, and the
 * four figures worth having on screen whatever question is being asked.
 */
export async function MemberHeader({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const { account, counts, wallet, orders, activity } = await adminGet<UserOverview>(
    `/admin/users/${encodeURIComponent(userId)}`,
  );

  const states = [
    account.deletedAt && { color: 'error' as const, text: 'deleted' },
    account.deletion.scheduledAt && { color: 'warning' as const, text: 'deletion scheduled' },
    account.flags.frozen && { color: 'error' as const, text: 'frozen' },
    account.flags.legalHold && { color: 'warning' as const, text: 'legal hold' },
    !account.emailVerifiedAt && { color: 'default' as const, text: 'email unverified' },
    !account.phoneVerifiedAt && { color: 'default' as const, text: 'phone unverified' },
  ].filter(Boolean) as { color: 'error' | 'warning' | 'default'; text: string }[];

  return (
    <Box sx={{ mt: 2 }}>
      <LinkButton
        href={paths.dashboard.users.root}
        size="small"
        color="inherit"
        startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
        sx={{ mb: 1.5, ml: -1 }}
      >
        All members
      </LinkButton>

      <Card sx={{ p: 3, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h4">{account.name || 'No name yet'}</Typography>
              <TrustChip tier={account.trust.tier} score={account.trust.score} />
              {states.map(state => (
                <Label key={state.text} color={state.color} variant="soft">
                  {state.text}
                </Label>
              ))}
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {account.email} · {account.phone}
              {account.country ? ` · ${account.country}` : ''}
              {account.timezone ? ` · ${account.timezone}` : ''}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Mono>{account.id}</Mono>
            </Box>
          </Box>

          <Stack
            direction="row"
            spacing={3}
            sx={{ flexWrap: 'wrap', gap: 3, flexShrink: 0, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}
          >
            <Figure label="Last here" value={ago(activity.lastActiveAt)} hint={activity.lastScreen ?? 'no screen reported'} />
            <Figure
              label="Installs"
              value={`${number(counts.activeDevices)}/${number(counts.devices)}`}
              hint={`${number(counts.liveSessions)} live session${counts.liveSessions === 1 ? '' : 's'}`}
            />
            <Figure label="Wallet" value={coins(wallet.balance)} hint={`${coins(wallet.pending)} pending`} />
            <Figure label="Orders" value={number(orders.count)} hint={rupees(orders.payable, true)} />
          </Stack>
        </Stack>
      </Card>

      <MemberTabs userId={account.id} />

      {/*
        Under the tabs, where `PageHeader` puts it on every other page: a
        member tab has no title block of its own, and the guide for the tab
        being read belongs above its figures rather than above the account.
      */}
      <SectionGuide />
    </Box>
  );
}

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="h6">{value}</Typography>
      {hint && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

export function MemberHeaderSkeleton() {
  return (
    <Box sx={{ mt: 2 }}>
      <Card sx={{ p: 3, mb: 3 }}>
        <Skeleton width={240} height={40} />
        <Skeleton width={320} height={20} />
        <Skeleton width={180} height={18} />
      </Card>
      <Skeleton variant="rounded" height={44} sx={{ mb: 3 }} />
    </Box>
  );
}
