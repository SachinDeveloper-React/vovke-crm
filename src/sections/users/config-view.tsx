import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { DataTable, Kv, Mono, Panel, PermissionChip, Stat, TextLink } from '@/src/components/ui';
import { adminGet, memberZone } from '@/src/lib/api';
import { ago, coins, dateTime, hours, humanise, number } from '@/src/lib/format';
import { paths } from '@/src/layout/paths';
import type { MemberConfig, MemberNotification, Page } from '@/src/lib/types';

import { MemberNotificationPrefsForm, MemberStepsForm, NudgeForm, SendMessageForm } from './config-forms';

/**
 * One member's own half of the step pipeline, and everything we say to them.
 *
 * The config page says what happens to everybody's steps; this says what
 * that means for this member — the goal they set, the ceiling their tier
 * puts on a day, when each phone last reported — and carries the two things
 * support actually has to *do*: ask a phone to sync, and tell them
 * something.
 */
export async function MemberConfigView({ userId }: { userId: string }) {
  const zone = await memberZone(userId);

  const [config, feed] = await Promise.all([
    adminGet<MemberConfig>(`/admin/users/${encodeURIComponent(userId)}/config`),
    adminGet<Page<MemberNotification>>(`/admin/users/${encodeURIComponent(userId)}/notifications`, { limit: 25 }),
  ]);

  const { account, steps, notifications } = config;
  const due = steps.installs.filter(install => install.stepSync.dueForNudge).length;
  const silenced = Object.entries(notifications.preferences.categories).filter(([, on]) => !on);

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Their daily goal"
            value={number(steps.goal.current)}
            icon="solar:target-bold-duotone"
            goodDirection="none"
            hint={steps.goal.setAt ? `chosen ${ago(steps.goal.setAt)}` : 'never chosen — this is the default'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Ceiling on a day"
            value={number(steps.ceiling.dailySteps)}
            icon="solar:ruler-bold-duotone"
            goodDirection="none"
            hint={`tier ${steps.ceiling.tier}${steps.ceiling.trustShadow ? ' (shadow — not enforced)' : ''} · escrow ${hours(steps.ceiling.holdHours)}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Last reported"
            value={ago(steps.upload.lastUploadAt)}
            icon="solar:cloud-upload-bold-duotone"
            goodDirection="none"
            hint={`${number(steps.signedIn)} of ${number(steps.installs.length)} install(s) signed in · a day may be sent for ${steps.upload.maxAgeDays} days`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Can be reached on"
            value={`${number(notifications.reachable.canShow)}/${number(notifications.reachable.installs)}`}
            icon="solar:bell-bold-duotone"
            goodDirection="none"
            hint={
              notifications.quiet.now
                ? `quiet hours for another ${notifications.quiet.endsInMinutes} min`
                : `${number(notifications.feed.unread)} unread of ${number(notifications.feed.total)}`
            }
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Panel
            title="Their step settings"
            subtitle="The two an operator may change"
            note="The goal range and everything else about how steps are judged is everyone's — it lives on the steps config page."
          >
            <MemberStepsForm userId={userId} config={config} />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Panel
            title="What their steps are worth"
            subtitle={steps.coins.enabled ? 'Minting is on' : 'Minting is off — days are scored and nothing is paid'}
          >
            <Kv
              items={[
                { label: 'Rate', value: `${coins(steps.coins.per1000)} coins / 1,000 verified steps` },
                { label: 'Most from steps in a day', value: `${number(steps.coins.sourceCap)} coins` },
                { label: 'Most from everything', value: `${number(steps.coins.dailyCap)} coins` },
                { label: 'Their tier’s step ceiling', value: `${number(steps.ceiling.dailySteps)} steps` },
                { label: 'Escrow window', value: hours(steps.ceiling.holdHours) },
                {
                  label: 'Trust',
                  value: `${account.trust.tier ?? '—'} · ${account.trust.score ?? '—'}`,
                  hint: steps.ceiling.trustShadow ? 'shadow mode: computed, not enforced' : undefined,
                },
              ]}
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                These come from <TextLink href={paths.dashboard.steps} variant="caption">the steps config</TextLink> and
                their trust tier, not from anything set on this member.
              </Typography>
            </Box>
          </Panel>
        </Grid>
      </Grid>

      <Panel
        title="Their phones, and what each one is doing about steps"
        subtitle={`${number(steps.signedIn)} signed in · chased silently after ${steps.upload.nudge.silentAfterHours} h, told after ${steps.upload.nudge.remindAfterHours} h`}
        note="Steps are only counted while the account is signed in on an install, and they only leave the phone from the foreground — which is what the nudge is for."
        action={<NudgeForm userId={userId} dueCount={due} />}
        dense
      >
        <DataTable
          columns={[
            { label: 'Phone' },
            { label: 'Signed in' },
            { label: 'Last reported', align: 'right' },
            { label: 'Last nudged', align: 'right' },
            { label: 'Step permission' },
            { label: 'Can be shown a push' },
          ]}
          rows={steps.installs.map(install => ({
            key: install.deviceId,
            tone: install.stepSync.dueForNudge || install.permissions.activityRecognition === 'blocked' ? 'danger' : 'default',
            cells: [
              <Stack key="phone" spacing={0.25}>
                <Typography variant="subtitle2">{install.label}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {install.platform === 'ios' ? 'iOS' : 'Android'} · app {install.appVersion ?? '—'}
                  {install.revoked ? ' · revoked' : ''}
                </Typography>
                <Mono>{install.deviceId}</Mono>
              </Stack>,
              <Label key="in" color={install.signedIn ? 'success' : 'default'} variant="soft">
                {install.signedIn ? 'yes' : 'no'}
              </Label>,
              <Stack key="up" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{ago(install.stepSync.uploadedAt)}</Typography>
                {install.stepSync.dueForNudge && (
                  <Typography variant="caption" sx={{ color: 'error.main' }}>
                    due a nudge
                  </Typography>
                )}
              </Stack>,
              <Stack key="nudge" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Typography variant="body2">{ago(install.stepSync.nudgedAt)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  told {ago(install.stepSync.remindedAt)}
                </Typography>
              </Stack>,
              install.permissions.activityRecognition ? (
                <PermissionChip key="perm" state={install.permissions.activityRecognition} />
              ) : (
                '—'
              ),
              <Stack key="push" spacing={0.25}>
                <Label color={install.push.canShow ? 'success' : 'warning'} variant="soft">
                  {install.push.canShow ? 'yes' : 'no'}
                </Label>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {install.push.hasToken ? 'token on file' : 'no token'}
                  {install.push.notifications ? ` · OS says ${install.push.notifications}` : ''}
                </Typography>
              </Stack>,
            ],
          }))}
          empty="No phone has ever registered against this account."
        />
      </Panel>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel
            title="What they have agreed to hear"
            subtitle={
              notifications.preferences.changed
                ? `${silenced.length} categor${silenced.length === 1 ? 'y' : 'ies'} silenced`
                : 'Everything as the account was created'
            }
            note="The switch decides whether a push is sent at all; quiet hours decide when. The feed row is written either way — it is the channel they can go and look at."
          >
            <MemberNotificationPrefsForm userId={userId} config={config} />
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Panel
            title="Tell them something"
            subtitle="Through the same path every job uses"
            note="An operator cannot talk past a switch the member has turned off: the row is written, the push is not, and the answer says so."
          >
            <SendMessageForm userId={userId} config={config} />
          </Panel>
        </Grid>
      </Grid>

      <Panel
        title="What they have been told"
        subtitle={`${number(notifications.feed.total)} in the feed · ${number(notifications.feed.unread)} unread`}
        note="The one thing their own copy does not show is what became of the push — a row written and never pushed is the commonest answer to “I was never told”."
        dense
      >
        <DataTable
          columns={[
            { label: 'When' },
            { label: 'Topic' },
            { label: 'Message' },
            { label: 'Push' },
            { label: 'Read', align: 'right' },
          ]}
          rows={feed.data.map(row => ({
            key: row.id,
            cells: [
              <Stack key="at" spacing={0.25}>
                <Typography variant="body2">{ago(row.createdAt)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {dateTime(row.createdAt, zone)}
                </Typography>
              </Stack>,
              <Label key="topic" color="default" variant="soft">
                {row.topic}
              </Label>,
              <Stack key="msg" spacing={0.25} sx={{ maxWidth: 420 }}>
                <Typography variant="subtitle2">{row.title}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {row.message}
                </Typography>
                {row.dedupeKey && <Mono>{row.dedupeKey}</Mono>}
              </Stack>,
              row.pushedAt ? (
                <Stack key="push" spacing={0.25}>
                  <Label color="success" variant="soft">
                    pushed
                  </Label>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {ago(row.pushedAt)}
                  </Typography>
                </Stack>
              ) : row.pushDeferredUntil ? (
                <Stack key="push" spacing={0.25}>
                  <Label color="warning" variant="soft">
                    held
                  </Label>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    until {dateTime(row.pushDeferredUntil, zone)}
                  </Typography>
                </Stack>
              ) : (
                <Label key="push" color="default" variant="soft">
                  feed only
                </Label>
              ),
              <Stack key="read" spacing={0.25} sx={{ textAlign: 'right' }}>
                <Label color={row.read ? 'success' : 'default'} variant="soft">
                  {row.read ? 'read' : 'unread'}
                </Label>
                {row.readAt && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {ago(row.readAt)}
                  </Typography>
                )}
              </Stack>,
            ],
          }))}
          empty="Nothing has ever been sent to this member."
        />
      </Panel>

      {silenced.length > 0 && (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Silenced: {silenced.map(([name]) => humanise(name)).join(', ')}. Those messages are still written to their
          notification centre; only the push is withheld.
        </Typography>
      )}
    </Stack>
  );
}
