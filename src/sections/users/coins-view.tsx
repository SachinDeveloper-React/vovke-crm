import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ColumnChart, RankedBars } from '@/src/components/charts';
import { Label } from '@/src/components/label';
import { CursorPager, DataTable, Kv, Mono, Panel, SelectFilter, Stat } from '@/src/components/ui';
import { adminGet, memberZone } from '@/src/lib/api';
import { ago, coins, dateTime, date as formatDate, humanise, number } from '@/src/lib/format';
import type { LedgerRow, MemberWallet, Page } from '@/src/lib/types';

import { AdjustCoinsForm } from './money-forms';

/**
 * Every coin in and out (RULES E2).
 *
 * The ledger is append-only: nothing in it was ever edited, and a correction
 * is a second row. That is what makes this the answer to "where did my coins
 * go" rather than a summary somebody has to trust — the rows *are* the
 * arithmetic behind the balance.
 */
export async function MemberCoinsView({
  userId,
  direction,
  source,
  cursor,
}: {
  userId: string;
  direction: string;
  source: string;
  cursor: string;
}) {
  const zone = await memberZone(userId);

  const [wallet, ledger] = await Promise.all([
    adminGet<MemberWallet>(`/admin/users/${encodeURIComponent(userId)}/wallet`),
    adminGet<Page<LedgerRow>>(`/admin/users/${encodeURIComponent(userId)}/ledger`, {
      limit: 50,
      direction,
      source: source || undefined,
      cursor: cursor || undefined,
    }),
  ]);

  const { balance, totals, bySource, holds, dailyCaps, rate } = wallet;
  const held = holds.filter(hold => hold.status === 'held');
  const voided = holds.filter(hold => hold.status === 'voided');

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Balance"
            value={coins(balance.coins)}
            icon="solar:wallet-money-bold-duotone"
            hint={
              balance.expiresAt
                ? `idle coins lapse ${ago(balance.expiresAt)} (${balance.expiryWindowDays}-day window)`
                : 'nothing to lapse'
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="In escrow"
            value={coins(totals.held)}
            icon="solar:lock-bold-duotone"
            goodDirection="none"
            hint={`${number(totals.heldCount)} hold(s) · ${coins(balance.pending)} shown as pending`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Earned, all time"
            value={coins(totals.earned)}
            icon="solar:arrow-right-up-bold-duotone"
            hint={`lifetime figure on the balance: ${coins(balance.lifetimeEarned)}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Spent, all time"
            value={coins(totals.spent)}
            icon="solar:arrow-left-down-bold-duotone"
            goodDirection="none"
            hint={`${number(totals.rows)} ledger row(s)`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel title="Where the coins came from" note="Every row ever written, grouped by source.">
            <RankedBars
              valueFormat="coins"
              items={bySource.map(row => ({
                label: humanise(row.source),
                value: row.earned,
                hint: row.spent > 0 ? `${coins(row.spent)} spent` : `${number(row.rows)} rows`,
              }))}
              emptyText="No coin has ever moved on this account."
            />
            <Box sx={{ mt: 3 }}>
              <Kv
                items={[
                  { label: 'Daily ceiling', value: `${number(rate.dailyCap)} coins` },
                  { label: 'Most from steps', value: `${number(rate.sourceCaps.steps ?? 0)} coins a day` },
                  { label: 'Step coins', value: rate.stepsEnabled ? 'minting' : 'off (shadow)' },
                  { label: 'Last credit', value: ago(balance.lastCreditAt) },
                ]}
              />
            </Box>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Panel
            title="The daily ceiling, day by day"
            subtitle="What it let through, and what it refused"
            note="A capped day is the ceiling working, not an error: the member earned more than one day may mint."
          >
            <ColumnChart
              data={[...dailyCaps].reverse().map(cap => ({ date: cap.localDay, earned: cap.earned, capped: cap.capped }))}
              series={[
                { key: 'earned', label: 'Credited' },
                { key: 'capped', label: 'Refused by the cap' },
              ]}
              valueFormat="coins"
              height={240}
              ariaLabel="Coins credited and capped per day"
            />
          </Panel>
        </Grid>
      </Grid>

      <Panel
        title="The ledger"
        subtitle="Newest first — append-only, so a correction is another row"
        action={
          <Stack direction="row" spacing={1}>
            <SelectFilter
              label="Direction"
              param="direction"
              value={direction}
              options={[
                { value: 'any', label: 'In and out' },
                { value: 'in', label: 'Credits' },
                { value: 'out', label: 'Spends' },
              ]}
              width={140}
            />
            <SelectFilter
              label="Source"
              param="source"
              value={source}
              options={[
                { value: '', label: 'Every source' },
                ...['steps', 'workout', 'streak', 'challenge', 'referral', 'purchase', 'refund'].map(value => ({
                  value,
                  label: humanise(value),
                })),
              ]}
              width={150}
            />
          </Stack>
        }
        dense
      >
        <DataTable
          columns={[
            { label: 'When' },
            { label: 'What' },
            { label: 'Source' },
            { label: 'Amount', align: 'right' },
            { label: 'About' },
            { label: 'By' },
          ]}
          rows={ledger.data.map(row => ({
            key: row.id,
            cells: [
              <Stack key="at" spacing={0.25}>
                <Typography variant="body2">{ago(row.createdAt)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {dateTime(row.createdAt, zone)}
                </Typography>
              </Stack>,
              <Typography key="title" variant="subtitle2">
                {row.title}
              </Typography>,
              <Label key="source" color="default" variant="soft">
                {row.source}
              </Label>,
              <Typography
                key="amount"
                variant="subtitle2"
                sx={{ fontVariantNumeric: 'tabular-nums', color: row.amount < 0 ? 'error.main' : 'success.main' }}
              >
                {row.amount > 0 ? '+' : ''}
                {coins(row.amount)}
              </Typography>,
              <Stack key="ref" spacing={0.25} sx={{ maxWidth: 240 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {humanise(row.referenceType)}
                </Typography>
                <Mono>{row.referenceId}</Mono>
              </Stack>,
              <Stack key="by" spacing={0.25}>
                <Typography variant="body2">{row.actor}</Typography>
                {row.appVersion && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    app {row.appVersion}
                  </Typography>
                )}
              </Stack>,
            ],
          }))}
          empty={
            direction !== 'any' || source
              ? 'No row matches those filters.'
              : 'Nothing has ever been credited to or spent from this wallet.'
          }
        />
        <CursorPager next={ledger.nextCursor} cursor={cursor} />
      </Panel>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel
            title="Escrow"
            subtitle={`${number(held.length)} still held · ${number(voided.length)} voided`}
            note="Step coins are held before they are paid (RULES E15): the window is the trust tier's, and the times below are on the member's own clock. A confirmed fraud flag voids what the day was holding — that is what a voided row is. The newest 50 holds; the ledger below carries every row, paged."
            dense
          >
            <DataTable
              columns={[
                { label: 'Day' },
                { label: 'Amount', align: 'right' },
                { label: 'Status' },
                { label: 'Releases' },
                { label: 'Reason' },
              ]}
              rows={holds.map(hold => ({
                key: hold.id,
                cells: [
                  <Stack key="day" spacing={0.25}>
                    <Typography variant="body2">{hold.localDay ? formatDate(hold.localDay) : humanise(hold.source)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {dateTime(hold.createdAt, zone)}
                    </Typography>
                  </Stack>,
                  coins(hold.amount),
                  <Label
                    key="status"
                    color={hold.status === 'held' ? 'warning' : hold.status === 'released' ? 'success' : 'error'}
                    variant="soft"
                  >
                    {hold.status}
                  </Label>,
                  hold.releaseAfter ? (
                    <Stack key="due" spacing={0.25}>
                      <Typography variant="body2">{ago(hold.releaseAfter)}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {dateTime(hold.releaseAfter, zone)}
                      </Typography>
                    </Stack>
                  ) : (
                    '—'
                  ),
                  <Typography key="reason" variant="caption" sx={{ color: 'text.secondary' }}>
                    {hold.reason ?? '—'}
                  </Typography>,
                ],
              }))}
              empty="No step coin has ever been held for this account."
            />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Panel
            title="Put something right"
            subtitle="A credit, or a clawback"
            note="This is the tool the fraud queue points at: confirming a flag voids what a day was holding, and coins already released can only be answered by a row like this."
          >
            <AdjustCoinsForm userId={userId} balance={balance.coins} />
          </Panel>
        </Grid>
      </Grid>
    </Stack>
  );
}
