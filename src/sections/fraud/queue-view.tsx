import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { RankedBars } from '@/src/components/charts';
import { Label } from '@/src/components/label';
import { DataTable, DaysFilter, FilterBar, LinkButton, Mono, Panel, RowLink, SelectFilter, Stat, TrustChip } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, coins, humanise, number, percent, shortId } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { FraudQueue } from '@/src/lib/types';

/**
 * Who has something to answer for, worst first (RULES A27).
 *
 * By account rather than by flag, because the question an operator is
 * actually asking is "who is doing this" — and one afternoon of shaking a
 * phone writes a dozen flags that all mean the same thing.
 */
export async function FraudQueueView({
  status,
  severity,
  days,
  limit,
}: {
  status: string;
  severity: string;
  days: number;
  limit: number;
}) {
  const queue = await adminGet<FraudQueue>('/admin/fraud/queue', { status, severity, days, limit });

  const accounts = queue.data;
  const held = accounts.reduce((sum, row) => sum + row.heldCoins, 0);
  const hard = accounts.reduce((sum, row) => sum + row.flags.hard, 0);
  const open = accounts.reduce((sum, row) => sum + row.flags.open, 0);
  const kinds = new Map<string, number>();
  for (const row of accounts) for (const kind of row.kinds) kinds.set(kind, (kinds.get(kind) ?? 0) + 1);

  return (
    <Stack spacing={3}>
      <FilterBar>
        <SelectFilter
          label="Verdict"
          param="status"
          value={status}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'dismissed', label: 'Dismissed' },
            { value: 'any', label: 'Any' },
          ]}
        />
        <SelectFilter
          label="Severity"
          param="severity"
          value={severity}
          options={[
            { value: 'any', label: 'Hard and soft' },
            { value: 'hard', label: 'Hard only' },
            { value: 'soft', label: 'Soft only' },
          ]}
          width={160}
        />
        <SelectFilter
          label="Show"
          param="limit"
          value={String(limit)}
          options={[25, 50, 100].map(option => ({ value: String(option), label: `${option} accounts` }))}
          width={150}
        />
        <DaysFilter value={days} options={[7, 30, 90, 365]} />
      </FilterBar>

      <Grid container spacing={3}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat label="Accounts in the queue" value={number(accounts.length)} goodDirection="down" icon="solar:users-group-two-rounded-bold-duotone" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat label="Hard flags" value={number(hard)} goodDirection="down" icon="solar:shield-cross-bold-duotone" hint="A hard flag refuses the day on its own" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat label="Still open" value={number(open)} goodDirection="down" icon="solar:hourglass-bold-duotone" hint="An open flag keeps costing them trust" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat label="Coins in escrow" value={coins(held)} icon="solar:lock-bold-duotone" hint="What confirmations would void" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Panel
            title="Worst first"
            subtitle="Hard flags before soft ones, then how many, then how recent"
            note="“Shown” against “verified” is the claim: the gap is what the layers would not accept."
            dense
          >
            <DataTable
              columns={[
                { label: 'Member' },
                { label: 'Trust' },
                { label: 'Flags' },
                { label: 'What for' },
                { label: 'Steps shown · verified', align: 'right' },
                { label: 'Escrow', align: 'right' },
                { label: '', align: 'right', width: 110 },
              ]}
              rows={accounts.map(row => ({
                key: row.userId,
                tone: row.flags.hard > 0 ? 'danger' : 'default',
                cells: [
                  <Stack key="who" spacing={0.25}>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <RowLink href={paths.dashboard.users.fraud(row.userId)}>{row.name || 'No name yet'}</RowLink>
                      {row.frozen && (
                        <Label color="error" variant="soft">
                          frozen
                        </Label>
                      )}
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {row.email ?? '—'}
                    </Typography>
                    <Mono>{shortId(row.userId, 8)}</Mono>
                  </Stack>,
                  <TrustChip key="trust" tier={row.trust.tier} score={row.trust.score} />,
                  <Stack key="flags" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {row.flags.hard > 0 && (
                      <Label color="error" variant="soft">
                        {number(row.flags.hard)} hard
                      </Label>
                    )}
                    {row.flags.soft > 0 && (
                      <Label color="warning" variant="soft">
                        {number(row.flags.soft)} soft
                      </Label>
                    )}
                    {row.flags.open > 0 && (
                      <Label color="info" variant="soft">
                        {number(row.flags.open)} open
                      </Label>
                    )}
                  </Stack>,
                  <Stack key="kinds" spacing={0.25} sx={{ maxWidth: 220 }}>
                    {row.kinds.slice(0, 3).map(kind => (
                      <Typography key={kind} variant="caption" sx={{ color: 'text.secondary' }}>
                        {humanise(kind)}
                      </Typography>
                    ))}
                    {row.kinds.length > 3 && (
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        +{row.kinds.length - 3} more
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      last {ago(row.lastFlagAt)}
                    </Typography>
                  </Stack>,
                  <Stack key="steps" spacing={0.25} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2">
                      {number(row.steps)} · {number(row.verifiedSteps)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {percent(row.steps > 0 ? row.verifiedSteps / row.steps : 0, 0)} over {number(row.activeDays)} days
                    </Typography>
                  </Stack>,
                  <Stack key="escrow" spacing={0.25} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2">{coins(row.heldCoins)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {number(row.holds)} hold{row.holds === 1 ? '' : 's'}
                    </Typography>
                  </Stack>,
                  <LinkButton key="open" href={paths.dashboard.users.fraud(row.userId)} size="small" variant="outlined">
                    Case file
                  </LinkButton>,
                ],
              }))}
              empty={
                status === 'open'
                  ? 'Nothing is waiting for a verdict. Every flag in this window has been judged.'
                  : 'No flag matches these filters.'
              }
            />
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Panel
            title="What they were flagged for"
            subtitle="Accounts per kind, in this window"
            note="A genuine phone failing a layer is a threshold to look at, not a cheat — which is why the queue counts accounts rather than flags."
          >
            <RankedBars
              items={[...kinds.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([kind, count]) => ({ label: humanise(kind), value: count, tone: 'warning' }))}
              emptyText="No flag matches these filters."
            />
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Confirming a flag voids what the day was <em>holding</em>. Coins already released are a ledger entry,
                and a ledger is corrected by a compensating row — a clawback is a decision about money, not a button in
                a review queue.
              </Typography>
            </Box>
          </Panel>
        </Grid>
      </Grid>
    </Stack>
  );
}
