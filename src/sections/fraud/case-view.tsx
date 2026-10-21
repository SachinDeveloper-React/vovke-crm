import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { RankedBars } from '@/src/components/charts';
import { Label } from '@/src/components/label';
import { DataTable, Evidence, FlagStatusChip, Kv, Mono, Panel, SelectFilter, Stat } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, coins, dateTime, date as formatDate, humanise, number, percent } from '@/src/lib/format';
import type { FraudCase } from '@/src/lib/types';

import { RescoreForm, VerdictForm } from './verdict-form';

/**
 * One account's case file: the flags, the days behind them with the layer
 * scores that produced them, what each phone had proved at the time, and the
 * coins those days are still holding.
 *
 * The evidence, not a verdict. An operator confirming a flag should be
 * looking at the day's own numbers — so the numbers are on the same screen as
 * the button, and the button asks twice.
 */
export async function FraudCaseView({ userId, days }: { userId: string; days: number }) {
  const file = await adminGet<FraudCase>(`/admin/fraud/users/${encodeURIComponent(userId)}`, { days });
  const { flags, days: scored, holds, attestations } = file;

  const open = flags.filter(flag => flag.status === 'open');
  const steps = scored.reduce((sum, day) => sum + day.steps, 0);
  const verified = scored.reduce((sum, day) => sum + day.verifiedSteps, 0);
  const heldCoins = holds.filter(hold => hold.status === 'held').reduce((sum, hold) => sum + hold.amount, 0);
  const voidedCoins = holds.filter(hold => hold.status === 'voided').reduce((sum, hold) => sum + hold.amount, 0);

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat
            label="Flags open"
            value={number(open.length)}
            goodDirection="down"
            icon="solar:shield-warning-bold-duotone"
            hint={`${number(flags.length)} in the last ${days} days`}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat
            label="Verified share"
            value={percent(steps > 0 ? verified / steps : 0)}
            icon="solar:verified-check-bold-duotone"
            hint={`${number(verified)} of ${number(steps)} steps`}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat
            label="Coins in escrow"
            value={coins(heldCoins)}
            icon="solar:lock-bold-duotone"
            hint="What a confirmation would void"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat
            label="Coins already voided"
            value={coins(voidedCoins)}
            icon="solar:trash-bin-trash-bold-duotone"
            goodDirection="none"
            hint="What a member means by “my coins disappeared”"
          />
        </Grid>
      </Grid>

      <Panel
        title="The flags"
        subtitle={`${number(open.length)} open · ${number(flags.filter(f => f.status === 'confirmed').length)} confirmed · ${number(flags.filter(f => f.status === 'dismissed').length)} dismissed`}
        action={
          <SelectFilter
            label="Window"
            param="days"
            value={String(days)}
            options={[7, 30, 90, 365].map(option => ({ value: String(option), label: `${option} days` }))}
            width={120}
          />
        }
        note="A hard flag makes the day unverified on its own; a soft one costs trust, and trust decides the escrow window and the step ceiling. An open flag left alone keeps costing them."
        dense
      >
        <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
          {flags.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.disabled', px: 3, py: 3 }}>
              No layer has flagged anything on this account in this window.
            </Typography>
          )}
          {flags.map(flag => (
            <Box key={flag.id} sx={{ px: 3, py: 2 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Label color={flag.severity === 'hard' ? 'error' : flag.severity === 'soft' ? 'warning' : 'default'} variant="soft">
                  {flag.severity}
                </Label>
                <Typography variant="subtitle2">{humanise(flag.kind)}</Typography>
                <Label color="default" variant="soft">
                  layer {flag.layer}
                </Label>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  on {formatDate(flag.localDay)}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <FlagStatusChip status={flag.status} />
              </Stack>

              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
                first seen {ago(flag.firstSeenAt)} · last seen {ago(flag.lastSeenAt)}
                {flag.deviceId ? ' · on install ' : ''}
                {flag.deviceId ? <Mono>{flag.deviceId}</Mono> : null}
              </Typography>

              {flag.details && <Evidence data={flag.details} label="What the layer saw" />}

              <VerdictForm flagId={flag.id} userId={userId} status={flag.status} />
            </Box>
          ))}
        </Stack>
      </Panel>

      <Panel
        title="The days behind them"
        subtitle="What each day showed, what it verified, and what the layers scored"
        note="Scores are 0–100 per layer, as they were when the day was scored — not a re-run under today's config. Re-scoring a day runs the layers again over the evidence already stored."
        dense
      >
        <DataTable
          columns={[
            { label: 'Day' },
            { label: 'Shown', align: 'right' },
            { label: 'Verified', align: 'right' },
            { label: 'Pedometer', align: 'right' },
            { label: 'Plausibility', align: 'right' },
            { label: 'Layers' },
            { label: 'Refusals' },
            { label: '', align: 'right' },
          ]}
          rows={scored.map(day => ({
            key: day.localDay,
            tone: day.verified ? 'default' : 'danger',
            cells: [
              <Stack key="day" spacing={0.25}>
                <Typography variant="subtitle2">{formatDate(day.localDay)}</Typography>
                <Label color={day.verified ? 'success' : 'error'} variant="soft">
                  {day.verified ? 'verified' : 'refused'}
                </Label>
              </Stack>,
              number(day.steps),
              number(day.verifiedSteps),
              number(day.pedometerSteps),
              day.plausibility === null ? '—' : number(day.plausibility),
              <Stack key="layers" direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, maxWidth: 220 }}>
                {Object.entries(day.layers ?? {}).map(([layer, score]) => (
                  <Label key={layer} color={score === null ? 'default' : score < 50 ? 'error' : score < 80 ? 'warning' : 'success'} variant="soft">
                    {layer} {score ?? '—'}
                  </Label>
                ))}
              </Stack>,
              <Stack key="rejects" spacing={0.5} sx={{ maxWidth: 200 }}>
                {day.hardRejects.length === 0 && day.flags.length === 0 && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    none
                  </Typography>
                )}
                {day.hardRejects.map(reject => (
                  <Label key={reject} color="error" variant="soft">
                    {humanise(reject)}
                  </Label>
                ))}
                {day.flags.filter(flag => !day.hardRejects.includes(flag)).map(flag => (
                  <Label key={flag} color="warning" variant="soft">
                    {humanise(flag)}
                  </Label>
                ))}
              </Stack>,
              <RescoreForm key="rescore" userId={userId} localDay={day.localDay} />,
            ],
          }))}
          empty="No day has been scored for this account in this window."
        />
      </Panel>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel
            title="Step-coin holds"
            subtitle="Escrow, and what became of it"
            note="Step coins are held before they are paid; a hold is released by the job or voided by a confirmation."
            dense
          >
            <DataTable
              columns={[{ label: 'Day' }, { label: 'Amount', align: 'right' }, { label: 'Status' }, { label: 'Reason' }]}
              rows={holds.map(hold => ({
                key: hold.id,
                cells: [
                  <Stack key="day" spacing={0.25}>
                    <Typography variant="body2">{hold.localDay ? formatDate(hold.localDay) : '—'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {hold.releaseAfter ? `releases ${ago(hold.releaseAfter)}` : dateTime(hold.createdAt)}
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
                  <Typography key="reason" variant="caption" sx={{ color: 'text.secondary' }}>
                    {hold.reason ?? '—'}
                  </Typography>,
                ],
              }))}
              empty="No step coin has ever been held for this account."
            />
          </Panel>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Panel
            title="What the phones proved"
            subtitle="The attestation record, newest first"
            note="A Keystore key that cannot be attested, or a day that carried no Play verdict, is itself a refusal."
            dense
          >
            <DataTable
              columns={[{ label: 'Install' }, { label: 'Provider' }, { label: 'Verdict' }, { label: 'Checked', align: 'right' }]}
              rows={attestations.map((record, index) => ({
                key: `${record.deviceId}-${record.checkedAt}-${index}`,
                cells: [
                  <Mono key="device">{record.deviceId}</Mono>,
                  record.provider,
                  <Label
                    key="verdict"
                    color={record.verdict === 'pass' || record.verdict === 'verified' ? 'success' : 'error'}
                    variant="soft"
                  >
                    {record.verdict}
                  </Label>,
                  ago(record.checkedAt),
                ],
              }))}
              empty="No attestation has been recorded."
            />
          </Panel>
        </Grid>
      </Grid>

      {scored.some(day => day.devices.length > 0) && (
        <Panel
          title="Day by day, phone by phone"
          subtitle="What each install counted, what it proved, and what the layers made of it"
          note="Counts from two phones are never added together — the day takes one of them, and this is the decision as it was made."
          dense
        >
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
            {scored
              .filter(day => day.devices.length > 0)
              .map(day => (
                <Box key={day.localDay} sx={{ px: 3, py: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {formatDate(day.localDay)} · {number(day.deviceCount)} install
                    {day.deviceCount === 1 ? '' : 's'} sent this day
                  </Typography>
                  <Grid container spacing={2}>
                    {day.devices.map((device, index) => (
                      <Grid key={`${day.localDay}-${device.deviceId}-${index}`} size={{ xs: 12, md: 6 }}>
                        <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'var(--mui-palette-background-neutral)' }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                            <Label color={device.verified ? 'success' : 'error'} variant="soft">
                              {device.verified ? 'taken' : 'refused'}
                            </Label>
                            <Mono>{device.deviceId}</Mono>
                            {device.source && (
                              <Label color="default" variant="soft">
                                {device.source}
                              </Label>
                            )}
                          </Stack>
                          <Kv
                            columns={2}
                            items={[
                              { label: 'Candidate', value: number(device.candidate ?? null) },
                              { label: 'Verified', value: number(device.verifiedSteps ?? null) },
                              { label: 'Plausibility', value: number(device.plausibility ?? null) },
                              { label: 'Hard rejects', value: (device.hard ?? []).length ? (device.hard ?? []).join(', ') : 'none' },
                            ]}
                          />
                          {device.layers && (
                            <Box sx={{ mt: 1.5 }}>
                              <RankedBars
                                max={100}
                                items={Object.entries(device.layers).map(([layer, score]) => ({
                                  label: layer,
                                  value: score ?? 0,
                                  tone: (score ?? 100) < 50 ? 'critical' : (score ?? 100) < 80 ? 'warning' : 'accent',
                                }))}
                              />
                            </Box>
                          )}
                          {device.proof && <Evidence data={device.proof} label="What it proved" />}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
          </Stack>
        </Panel>
      )}
    </Stack>
  );
}
