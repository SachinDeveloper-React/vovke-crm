import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from '@/src/components/label';
import { DataTable, Kv, Mono, Panel, Stat } from '@/src/components/ui';
import { adminGet } from '@/src/lib/api';
import { ago, number } from '@/src/lib/format';
import type { AutomationRow, Automations, CampaignRow, MessageFigures } from '@/src/lib/types';

import {
  AutomationForm,
  CampaignForm,
  CampaignQuickEdit,
  ResetAutomationForm,
  SettingsForm,
  TryAutomationForm,
} from './forms';
import { WEEKDAYS, hourLabel } from './labels';

const CATEGORY_COLOR: Record<string, 'success' | 'info' | 'warning' | 'secondary' | 'primary'> = {
  motivation: 'success',
  information: 'info',
  update: 'warning',
  offer: 'secondary',
  reward: 'primary',
};

/** "Mon–Fri", "Every day", "Mon, Thu". */
function daysOf(weekdays: number[]): string {
  if (weekdays.length === 7) return 'every day';
  if (weekdays.join(',') === '0,1,2,3,4') return 'Mon–Fri';
  if (weekdays.join(',') === '5,6') return 'weekends';
  return weekdays.map(day => WEEKDAYS[day]).join(', ');
}

function whenOf(automation: AutomationRow): string {
  if (automation.timing === 'event' || automation.hour === null) return 'As it happens';
  return `${hourLabel(automation.hour)}, ${daysOf(automation.weekdays)}`;
}

function figures(stats: MessageFigures, days: number): string {
  if (stats.sent === 0) return `Nothing sent in ${days} days`;
  const opened = Math.round((stats.read / stats.sent) * 100);
  return `${number(stats.sent)} sent · ${number(stats.pushed)} pushed · ${opened}% opened (${days} days)`;
}

function scheduleOf(campaign: CampaignRow): string {
  const at = hourLabel(campaign.schedule.hour);
  if (campaign.schedule.kind === 'once') return `Once, ${campaign.schedule.date ?? '—'} at ${at}`;
  const window = [campaign.startsOn ? `from ${campaign.startsOn}` : '', campaign.endsOn ? `until ${campaign.endsOn}` : '']
    .filter(Boolean)
    .join(' ');
  const days = campaign.schedule.kind === 'daily' ? 'Every day' : daysOf(campaign.schedule.weekdays);
  return `${days} at ${at}${window ? `, ${window}` : ''}`;
}

function segmentOf(segment: Record<string, unknown>): string {
  const parts = [
    segment.tier ? `trust ${segment.tier}` : '',
    segment.platform ? (segment.platform === 'ios' ? 'iOS' : 'Android') : '',
    segment.seenWithinDays ? `seen in ${segment.seenWithinDays} days` : '',
    segment.notSeenForDays ? `quiet ${segment.notSeenForDays}+ days` : '',
    segment.pushableOnly ? 'pushable only' : '',
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'Everybody';
}

/**
 * What the server says on its own (RULES M11), and when.
 *
 * Two kinds, on one page because they share the cap, the member's clock
 * and the consent switches:
 *
 *   - **Automations** are built in: each has a reason the server checks
 *     (behind on today's goal, three days quiet, an old build, a saved
 *     reward now affordable). What is editable is on/off, the hour on the
 *     member's own clock, the days, the thresholds, and the words — several
 *     lines per message, one per member per day in turn.
 *   - **Scheduled messages** have no reason but the date: written whole,
 *     sent at the member's local hour to the same segments Messages uses.
 *
 * Every line can be tried on a real member before it is switched on.
 */
export async function AutomationsView() {
  const data = await adminGet<Automations>('/admin/automations');
  const on = data.automations.filter(automation => automation.enabled).length;
  const week = data.automations.reduce((sum, automation) => sum + automation.last7Days.sent, 0);
  const scheduled = data.campaigns.filter(campaign => campaign.state === 'scheduled').length;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Automated messages"
            value={data.settings.enabled ? 'On' : 'Stopped'}
            icon="solar:bolt-bold-duotone"
            goodDirection="none"
            hint={data.settings.enabled ? `${on} of ${data.automations.length} automations on` : 'nothing automated goes out'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Most a member gets a day"
            value={number(data.settings.maxPerDay)}
            icon="solar:shield-check-bold-duotone"
            goodDirection="none"
            hint="their own news is never held back"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Sent by automations"
            value={number(week)}
            icon="solar:plain-bold-duotone"
            goodDirection="none"
            hint="in the last 7 days"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Scheduled messages"
            value={number(scheduled)}
            icon="solar:calendar-bold-duotone"
            goodDirection="none"
            hint={`${number(data.campaigns.length)} written in all`}
          />
        </Grid>
      </Grid>

      <Panel
        title="The rules over all of them"
        subtitle={`Hours are each member's own clock; members with no zone on file are on ${data.timezone}`}
        note="Switching off here stops every automation and scheduled message at once, and changes nothing else. A member who turned Tips & Motivation off in the app gets none of the motivation or information ones — not even a feed row."
      >
        <SettingsForm settings={data.settings} />
      </Panel>

      {data.automations.map(automation => (
        <Panel
          key={automation.key}
          title={automation.label}
          subtitle={automation.trigger}
          note={figures(automation.last7Days, 7)}
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
              <Label color={automation.enabled ? 'success' : 'default'} variant="soft">
                {automation.enabled ? 'on' : 'off'}
              </Label>
              <Label color={CATEGORY_COLOR[automation.category] ?? 'default'} variant="soft">
                {automation.category}
              </Label>
              <Label color="default" variant="outlined">
                {whenOf(automation)}
              </Label>
              <Label color="default" variant="outlined">
                switch: {automation.preference}
              </Label>
              {automation.exemptFromCap && (
                <Label color="info" variant="outlined">
                  not capped
                </Label>
              )}
              {automation.dropInQuietHours && (
                <Label color="default" variant="outlined">
                  skipped in quiet hours
                </Label>
              )}
              {automation.customised && automation.updatedAt && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  changed {ago(automation.updatedAt)}
                  {automation.updatedBy ? ` by ${automation.updatedBy}` : ''}
                </Typography>
              )}
            </Stack>

            <Stack spacing={0.75}>
              {automation.templates.map(template => (
                <Stack key={template.id} spacing={0} sx={{ opacity: template.active ? 1 : 0.5 }}>
                  <Typography variant="subtitle2">
                    {template.title}
                    {automation.slots.length > 1 && (
                      <Typography component="span" variant="caption" sx={{ color: 'text.disabled', ml: 1 }}>
                        {automation.slots.find(slot => slot.key === template.slot)?.label ?? template.slot}
                      </Typography>
                    )}
                    {!template.active && (
                      <Typography component="span" variant="caption" sx={{ color: 'error.main', ml: 1 }}>
                        not live
                      </Typography>
                    )}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {template.message}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <AutomationForm automation={automation} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Try it on a member — their own figures, their own clock
                </Typography>
                <TryAutomationForm automationKey={automation.key} />
              </Grid>
              {automation.customised && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                    Put the code&apos;s own hour, days and words back
                  </Typography>
                  <ResetAutomationForm automationKey={automation.key} />
                </Grid>
              )}
            </Grid>
          </Stack>
        </Panel>
      ))}

      <Panel
        title="Schedule a message"
        subtitle="Written whole, sent at each member's own hour to a segment"
        note="Use this for anything with no reason but the date — a festival, a new feature, a weekly reminder. It shares the daily cap with the automations, so a member already told enough today is not told this too."
      >
        <CampaignForm links={data.links} variables={data.campaignVariables} />
      </Panel>

      <Panel title={`${number(data.campaigns.length)} scheduled message${data.campaigns.length === 1 ? '' : 's'}`} dense>
        <DataTable
          columns={[{ label: 'Message' }, { label: 'When and who', width: 260 }, { label: 'Change it', width: 240 }]}
          rows={data.campaigns.map(campaign => ({
            key: campaign.id,
            tone: campaign.state === 'scheduled' ? 'default' : 'danger',
            cells: [
              <Stack key="message" spacing={0.5} sx={{ maxWidth: 560 }}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  <Typography variant="subtitle2">{campaign.name}</Typography>
                  <Label color={CATEGORY_COLOR[campaign.category] ?? 'default'} variant="soft">
                    {campaign.category}
                  </Label>
                  <Label color={campaign.state === 'scheduled' ? 'success' : 'default'} variant="soft">
                    {campaign.state}
                  </Label>
                </Stack>
                <Typography variant="body2">
                  <strong>{campaign.title}</strong> — {campaign.message}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {figures(campaign.last30Days, 30)}
                  {campaign.lastRunAt ? ` · last ran ${ago(campaign.lastRunAt)}` : ''}
                </Typography>
                <CampaignForm campaign={campaign} links={data.links} variables={data.campaignVariables} />
              </Stack>,
              <Stack key="when" spacing={0.5}>
                <Typography variant="body2">{scheduleOf(campaign)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {segmentOf(campaign.segment)}
                </Typography>
                {campaign.link && <Mono>opens {campaign.link}</Mono>}
              </Stack>,
              <CampaignQuickEdit key="edit" campaign={campaign} />,
            ],
          }))}
          empty="Nothing scheduled yet."
        />
      </Panel>

      <Panel title="How it decides" dense={false}>
        <Kv
          items={[
            { label: 'Whose clock?', value: 'The member’s own. 08:00 is 08:00 where they live; the server checks every hour which zones are at the hour.' },
            { label: 'Once', value: 'Every message is keyed to its occasion (the automation and the member’s date), so a second run of the same hour sends nothing.' },
            { label: 'Too much', value: 'The cap counts automated and scheduled messages in the member’s own day. A goal reached and a saved reward now affordable do not count and are never held back.' },
            { label: 'Switched off', value: 'Motivation and information obey Tips & Motivation, updates Announcements, offers Offers & Promotions, saved rewards Coins & Rewards. Off means no feed row either.' },
            { label: 'Quiet hours', value: 'Check-ins only worth their moment are skipped inside the member’s quiet hours; the rest wait until the hours end.' },
            { label: 'Where a tap goes', value: 'Each message can open a screen (home, steps, wallet, shop, wishlist, update) or a product (product:<id>). An app too old to know one opens the topic’s screen instead.' },
          ]}
        />
      </Panel>
    </Stack>
  );
}
