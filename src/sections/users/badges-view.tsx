import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { Label } from '@/src/components/label';
import { DataTable, Mono, Panel, Stat } from '@/src/components/ui';
import { GrantBadgeForm } from './badge-form';
import { adminGet } from '@/src/lib/api';
import { ago, coins, dateTime, date as formatDate, humanise, number, percent } from '@/src/lib/format';
import type { Badge, MemberAchievements } from '@/src/lib/types';

/**
 * The badge shelf, and the challenges that pay them (RULES C4, C7).
 *
 * The whole shelf, not only what they hold: "why have I not got that badge"
 * is the question support is actually asked, and a list of the ones they have
 * cannot answer it. Each badge says what unlocks it and what it is worth —
 * and whether badge coins are switched on yet, because a badge that unlocked
 * while they were off is a payment still owed.
 */
export async function MemberBadgesView({ userId }: { userId: string }) {
  const report = await adminGet<MemberAchievements>(`/admin/users/${encodeURIComponent(userId)}/achievements`);
  const { summary, badges, challenges } = report;

  const unlocked = badges.filter(badge => badge.unlocked);
  const locked = badges.filter(badge => !badge.unlocked);

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Badges unlocked"
            value={`${number(summary.unlocked)}/${number(summary.total)}`}
            icon="solar:medal-ribbons-star-bold-duotone"
            hint={percent(summary.total > 0 ? summary.unlocked / summary.total : 0, 0) + ' of the shelf'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Badge coins"
            value={summary.rewardsEnabled ? 'paying' : 'off'}
            icon="solar:dollar-minimalistic-bold-duotone"
            goodDirection="none"
            hint={
              summary.rewardsEnabled
                ? 'unlocking a badge pays its coins'
                : `${coins(summary.coinsWaiting)} coins owed if switched on`
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Challenges finished"
            value={number(summary.challengesCompleted)}
            icon="solar:cup-star-bold-duotone"
            hint={`${coins(summary.challengeCoinsPaid)} coins actually paid`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Newest badge"
            value={unlocked[0] ? ago(unlocked[0].unlockedAt) : 'none yet'}
            icon="solar:star-bold-duotone"
            goodDirection="none"
            hint={unlocked[0]?.title ?? 'nothing on the shelf'}
          />
        </Grid>
      </Grid>

      <Panel
        title="The shelf"
        subtitle={`${number(unlocked.length)} held, ${number(locked.length)} still to earn`}
        note="`via` is what unlocked it: the badge's own rule, or the challenge that pays it. A badge is never taken back."
      >
        <Grid container spacing={2}>
          {badges.map(badge => (
            <Grid key={badge.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <BadgeCard badge={badge} />
            </Grid>
          ))}
        </Grid>
        {badges.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            No badge has been defined yet — the shelf itself is seeded content.
          </Typography>
        )}
      </Panel>

      <Panel
        title="Give one by hand"
        subtitle="Through the same path the rules use"
        note="A badge is never taken back — here or anywhere — so only the ones they do not hold are offered."
      >
        <GrantBadgeForm userId={userId} locked={locked} rewardsEnabled={summary.rewardsEnabled} />
      </Panel>

      <Panel
        title="Challenge periods they finished"
        subtitle="And what each one actually paid"
        note="`granted` is less than the reward where the daily ceiling bit, and zero while step-derived rewards wait for step coins — which is what `unpaid` means here."
        dense
      >
        <DataTable
          columns={[
            { label: 'Challenge' },
            { label: 'Period' },
            { label: 'Progress', align: 'right' },
            { label: 'Reward', align: 'right' },
            { label: 'Paid', align: 'right' },
            { label: 'Finished', align: 'right' },
          ]}
          rows={challenges.map(row => ({
            key: row.id,
            cells: [
              <Stack key="what" spacing={0.25}>
                <Typography variant="subtitle2">{row.title}</Typography>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  <Label color="default" variant="soft">
                    {row.cadence}
                  </Label>
                  <Mono>{row.challengeId}</Mono>
                </Stack>
              </Stack>,
              <Typography key="period" variant="body2">
                {formatDate(row.period.from)} – {formatDate(row.period.to)}
              </Typography>,
              <Typography key="progress" variant="body2" sx={{ textAlign: 'right' }}>
                {number(row.progress)} / {number(row.goal)}
              </Typography>,
              <Typography key="reward" variant="body2" sx={{ textAlign: 'right' }}>
                {coins(row.rewardCoins)}
              </Typography>,
              <Stack key="paid" spacing={0.25} sx={{ alignItems: 'flex-end' }}>
                <Typography variant="subtitle2">{coins(row.granted)}</Typography>
                <Label
                  color={row.status === 'paid' ? 'success' : row.status === 'capped' ? 'warning' : 'default'}
                  variant="soft"
                >
                  {row.status}
                </Label>
              </Stack>,
              <Stack key="at" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{ago(row.completedAt)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {dateTime(row.completedAt)}
                </Typography>
              </Stack>,
            ],
          }))}
          empty="This member has not finished a challenge period yet."
        />
      </Panel>
    </Stack>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <Card
      sx={{
        p: 2,
        height: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        borderLeft: '3px solid',
        borderColor: badge.unlocked ? 'primary.main' : 'divider',
        opacity: badge.unlocked ? 1 : 0.72,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Iconify
          icon={badge.unlocked ? 'solar:medal-ribbons-star-bold-duotone' : 'solar:lock-keyhole-minimalistic-bold-duotone'}
          width={22}
          sx={{ color: badge.unlocked ? 'primary.main' : 'text.disabled' }}
        />
        <Typography variant="subtitle2" sx={{ flex: 1, minWidth: 0 }}>
          {badge.title}
        </Typography>
      </Stack>

      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {number(badge.value)} {humanise(badge.metric)}
        {badge.rule ? ` · ${humanise(badge.rule)}` : ''}
      </Typography>

      <Stack direction="row" spacing={0.5} sx={{ mt: 'auto', pt: 1, flexWrap: 'wrap', gap: 0.5 }}>
        {badge.unlocked ? (
          <Label color="success" variant="soft">
            {ago(badge.unlockedAt)}
          </Label>
        ) : (
          <Label color="default" variant="soft">
            locked
          </Label>
        )}
        {badge.rewardCoins > 0 && (
          <Label color={badge.rewardEnabled ? 'info' : 'warning'} variant="soft">
            {coins(badge.rewardCoins)} coins{badge.rewardEnabled ? '' : ' (off)'}
          </Label>
        )}
      </Stack>

      {badge.via && (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          via {humanise(badge.via)}
        </Typography>
      )}
      <Box sx={{ display: 'none' }}>{badge.id}</Box>
    </Card>
  );
}
