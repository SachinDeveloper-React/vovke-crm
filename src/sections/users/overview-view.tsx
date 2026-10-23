import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { BoolChip, DataTable, Evidence, Kv, LinkButton, Mono, Panel, SelectFilter, SeverityChip } from '@/src/components/ui';
import { adminGet, adminTry } from '@/src/lib/api';
import { ago, coins, dateTime, deviceLabel, humanise, number, rupees } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { AuditRow, Page, ProblemReport, UserOverview } from '@/src/lib/types';

import { StatusForm, VerifyContactForm } from './money-forms';

/**
 * The account in full, in the order the questions get asked: who they are,
 * when they installed it and on what, when they were last here, what the
 * wallet and the orders look like — and, at the top, whether anything is
 * wrong, because that is what the conversation is usually about.
 */
export async function MemberOverview({ userId, auditLimit = 20 }: { userId: string; auditLimit?: number }) {
  const [overview, problems, audit] = await Promise.all([
    adminGet<UserOverview>(`/admin/users/${encodeURIComponent(userId)}`),
    adminTry<ProblemReport>(`/admin/users/${encodeURIComponent(userId)}/problems`),
    adminTry<Page<AuditRow>>(`/admin/users/${encodeURIComponent(userId)}/audit`, { limit: auditLimit }),
  ]);
  const { account, activity, wallet, orders, counts, installs } = overview;

  return (
    <Stack spacing={3}>
      {'data' in problems && (
        <Panel
          title="Anything wrong?"
          subtitle={
            problems.data.summary.headline ??
            'Nothing is wrong that the phones have told us about — every install that has reported is working.'
          }
          action={
            problems.data.findings.length > 0 ? (
              <LinkButton href={paths.dashboard.users.problems(userId)} size="small" variant="outlined">
                Read the diagnosis
              </LinkButton>
            ) : undefined
          }
        >
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {problems.data.summary.high > 0 && (
              <Label color="error" variant="soft">
                {number(problems.data.summary.high)} high
              </Label>
            )}
            {problems.data.summary.medium > 0 && (
              <Label color="warning" variant="soft">
                {number(problems.data.summary.medium)} medium
              </Label>
            )}
            {problems.data.summary.low > 0 && (
              <Label color="default" variant="soft">
                {number(problems.data.summary.low)} low
              </Label>
            )}
            <Label color="info" variant="soft">
              {number(problems.data.summary.signedIn)} of {number(problems.data.summary.installs)} installs signed in
            </Label>
          </Stack>
        </Panel>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Panel
            title="What they have done"
            subtitle="Each one is a tab of its own"
            note="The figures here are the headline; the tabs carry the rows behind them."
          >
            <Kv
              items={[
                { label: 'Steps & activity', value: <LinkButton href={paths.dashboard.users.steps(userId)} size="small" variant="outlined">Open</LinkButton>, hint: 'days walked, verified share, streak' },
                { label: 'Coins', value: <LinkButton href={paths.dashboard.users.coins(userId)} size="small" variant="outlined">Open</LinkButton>, hint: `${coins(wallet.balance)} held · every row in and out` },
                { label: 'Badges', value: <LinkButton href={paths.dashboard.users.badges(userId)} size="small" variant="outlined">Open</LinkButton>, hint: 'the shelf, and challenges finished' },
                { label: 'Orders', value: <LinkButton href={paths.dashboard.users.orders(userId)} size="small" variant="outlined">Open</LinkButton>, hint: `${number(orders.count)} order(s) · ${rupees(orders.payable, true)}` },
                { label: 'Config & messages', value: <LinkButton href={paths.dashboard.users.config(userId)} size="small" variant="outlined">Open</LinkButton>, hint: 'goal, zone, switches, what we told them' },
              ]}
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Panel title="Account" note="The sign-up. The install is per phone, below.">
            <Kv
              items={[
                { label: 'Name', value: account.name || '—' },
                { label: 'Email', value: account.email, hint: account.emailVerifiedAt ? `verified ${dateTime(account.emailVerifiedAt)}` : 'not verified' },
                { label: 'Phone', value: account.phone, hint: account.phoneVerifiedAt ? `verified ${dateTime(account.phoneVerifiedAt)}` : 'not verified' },
                { label: 'Signed up', value: dateTime(account.signedUpAt), hint: ago(account.signedUpAt) },
                { label: 'Profile completed', value: account.profileCompletedAt ? dateTime(account.profileCompletedAt) : 'not completed' },
                { label: 'Gender · born', value: `${account.gender ?? '—'} · ${account.dateOfBirth ?? '—'}` },
                { label: 'Country · zone', value: `${account.country ?? '—'} · ${account.timezone ?? '—'}` },
                { label: 'Trust', value: `${account.trust.tier ?? '—'} · ${account.trust.score ?? '—'}` },
                { label: 'Frozen', value: <BoolChip value={account.flags.frozen} goodWhen={false} yes="frozen" no="no" /> },
                { label: 'Legal hold', value: <BoolChip value={account.flags.legalHold} goodWhen={false} yes="held" no="no" /> },
                { label: 'Deletion', value: account.deletion.scheduledAt ? `${dateTime(account.deletion.scheduledAt)} → purge ${dateTime(account.deletion.purgeAt)}` : 'none', hint: account.deletion.reason ?? undefined },
                { label: 'Last export', value: account.lastExportAt ? dateTime(account.lastExportAt) : 'never' },
              ]}
            />
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, md: 12 }}>
          <Stack spacing={3}>
            <Panel title="When they were last here" note="The heartbeat is the newest request from any of their phones, written at most once every five minutes.">
              <Kv
                items={[
                  { label: 'Last request', value: ago(activity.lastActiveAt), hint: dateTime(activity.lastActiveAt) },
                  { label: 'Last screen', value: activity.lastScreen ?? '—', hint: activity.lastScreenAt ? ago(activity.lastScreenAt) : undefined },
                  { label: 'Trail spans', value: `${dateTime(activity.firstEventAt)} → ${dateTime(activity.lastEventAt)}` },
                  { label: 'Events', value: `${number(activity.events)} all time`, hint: `${number(activity.events7d)} in 7d · ${number(activity.events30d)} in 30d` },
                  { label: 'Sign-ins', value: number(counts.logins) },
                ]}
              />
            </Panel>

            <Panel title="Wallet and orders" note="Coins as coins; money in rupees, converted from the paise the orders were placed in.">
              <Kv
                columns={2}
                items={[
                  { label: 'Balance', value: coins(wallet.balance) },
                  { label: 'Pending', value: coins(wallet.pending) },
                  { label: 'Lifetime earned', value: coins(wallet.lifetimeEarned) },
                  { label: 'Last credit', value: ago(wallet.lastCreditAt) },
                  { label: 'Orders', value: number(orders.count) },
                  { label: 'Paid in money', value: rupees(orders.payable) },
                  { label: 'Paid in coins', value: coins(orders.coinsUsed) },
                  { label: 'Last order', value: ago(orders.lastAt) },
                ]}
              />
            </Panel>
          </Stack>
        </Grid>
      </Grid>

      <Panel
        title="Phones on this account"
        subtitle={`${number(counts.activeDevices)} active of ${number(counts.devices)}`}
        action={
          <LinkButton href={paths.dashboard.users.installs(userId)} size="small" variant="outlined">
            Installs and permissions
          </LinkButton>
        }
        dense
      >
        <DataTable
          columns={[
            { label: 'Phone' },
            { label: 'Build' },
            { label: 'Signed in' },
            { label: 'Push' },
            { label: 'Installed' },
            { label: 'Last active', align: 'right' },
          ]}
          rows={installs.map(install => ({
            key: install.deviceId,
            tone: install.revokedAt ? 'danger' : 'default',
            cells: [
              <Stack key="phone" spacing={0.25}>
                <Typography variant="subtitle2">{deviceLabel(install.device)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {install.platform === 'ios' ? 'iOS' : 'Android'} {install.device.osVersion ?? ''}
                  {install.device.isEmulator ? ' · emulator' : ''}
                </Typography>
                <Mono>{install.deviceId}</Mono>
              </Stack>,
              <Stack key="build" spacing={0.25}>
                <Typography variant="body2">{install.app.version ?? '—'}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  first {install.app.firstVersion ?? '—'}
                </Typography>
              </Stack>,
              install.signedIn ? (
                <Stack key="in" spacing={0.25}>
                  <Label color="success" variant="soft">
                    signed in
                  </Label>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    since {ago(install.signedInAt)}
                  </Typography>
                </Stack>
              ) : (
                <Stack key="out" spacing={0.25}>
                  <Label color="default" variant="soft">
                    signed out
                  </Label>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {install.lastSignedOutAt ? ago(install.lastSignedOutAt) : 'never signed in'}
                  </Typography>
                </Stack>
              ),
              <BoolChip key="push" value={install.push.hasToken} yes="token" no="no token" />,
              <Typography key="installed" variant="body2">
                {ago(install.installedAt)}
              </Typography>,
              <Stack key="active" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{ago(install.lastActiveAt)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {dateTime(install.lastActiveAt)}
                </Typography>
              </Stack>,
            ],
          }))}
          empty="No phone has ever registered against this account, so nothing can count steps or be pushed to."
        />
      </Panel>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            <Panel
              title="Account state"
              subtitle="The two things an operator may change here"
              note="Freezing stops the account spending and leaves everything else alone — the days, the badges and the history stay exactly as they are. Both switches need a reason, and both are kept in the audit log."
            >
              <StatusForm
                userId={userId}
                frozen={account.flags.frozen}
                legalHold={account.flags.legalHold}
                deleted={Boolean(account.deletedAt)}
              />
            </Panel>

            <Panel
              title="Verify a contact detail"
              subtitle="For the member whose code never arrives"
              note="Both details proven is what redeeming, payouts and addresses are gated on, so a member who cannot receive an SMS is stuck for good. This is the way out, and it is one-way: the value is typed back before it will go, and there is no route that undoes it."
            >
              <VerifyContactForm
                userId={userId}
                email={account.email}
                phone={account.phone}
                emailVerified={Boolean(account.emailVerifiedAt)}
                phoneVerified={Boolean(account.phoneVerifiedAt)}
                deleted={Boolean(account.deletedAt)}
              />
            </Panel>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel
            title="Everything done to this account"
            subtitle="Operators and the member, newest first"
            note="The panel's own receipt: a verdict, a re-score, a goal set, a message sent, a freeze, a coin adjustment — and the member's own sign-ups and verifications beside them."
            action={
              <SelectFilter
                label="Show"
                param="audit"
                value={String(auditLimit)}
                options={[20, 50, 100, 200].map(option => ({ value: String(option), label: `${option} rows` }))}
                width={130}
              />
            }
            dense
          >
            {'error' in audit ? (
              <Box sx={{ px: 3, pb: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  The audit log could not be read: {audit.error.message}
                </Typography>
              </Box>
            ) : (
              <DataTable
                columns={[{ label: 'When' }, { label: 'What' }, { label: 'By' }, { label: 'Detail' }]}
                rows={audit.data.data.map(row => ({
                  key: row.id,
                  cells: [
                    <Stack key="at" spacing={0.25}>
                      <Typography variant="body2">{ago(row.at)}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {dateTime(row.at)}
                      </Typography>
                    </Stack>,
                    <Typography key="what" variant="subtitle2">
                      {humanise(row.action)}
                    </Typography>,
                    <Stack key="by" spacing={0.25}>
                      <Label color={row.actorType === 'admin' ? 'warning' : 'default'} variant="soft">
                        {row.actorType}
                      </Label>
                      {row.actorId && (
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          {row.actorId}
                        </Typography>
                      )}
                    </Stack>,
                    <Box key="detail" sx={{ maxWidth: 360 }}>
                      {row.after ? <Evidence data={row.after} label="" /> : <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>}
                    </Box>,
                  ],
                }))}
                empty="Nothing has been done to this account yet."
              />
            )}
          </Panel>
        </Grid>
      </Grid>

      {'error' in problems && (
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <SeverityChip severity="low" />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              The diagnosis could not be read: {problems.error.message}
            </Typography>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
