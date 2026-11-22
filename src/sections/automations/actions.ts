'use server';

import { revalidatePath } from 'next/cache';

import { adminWrite } from '@/src/lib/api';
import type { AutomationPreview, AutomationRow, CampaignRow } from '@/src/lib/types';

/**
 * The automated messages and the scheduled ones (RULES M11).
 *
 * Every write here changes what the server sends on its own, every day, to
 * everybody it applies to — so each one goes through the API's own checks
 * (a `{name}` the message cannot fill, a slot with no live line, a cap out
 * of range) and lands on the audit log with the operator's name.
 */

export type AutomationActionState = { ok?: string; error?: string; preview?: AutomationPreview };

const text = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();
const toggle = (form: FormData, key: string): boolean => form.getAll(key).map(String).pop() === 'on';

function changed(): void {
  revalidatePath('/dashboard/automations');
}

function json<T>(form: FormData, key: string): T | null {
  try {
    return JSON.parse(text(form, key)) as T;
  } catch {
    return null;
  }
}

/** The rules over every automation: the master switch, the daily cap, who counts as active. */
export async function saveAutomationSettings(
  _previous: AutomationActionState,
  form: FormData,
): Promise<AutomationActionState> {
  const result = await adminWrite<{ enabled: boolean; maxPerDay: number; activeWithinDays: number }>(
    'PUT',
    '/admin/automations/settings',
    {
      enabled: toggle(form, 'enabled'),
      maxPerDay: Number(text(form, 'maxPerDay')),
      activeWithinDays: Number(text(form, 'activeWithinDays')),
      note: text(form, 'note') || undefined,
    },
  );
  if (!result.ok) return { error: result.error };
  changed();
  const { enabled, maxPerDay, activeWithinDays } = result.data;
  return {
    ok: enabled
      ? `On. At most ${maxPerDay} a member a day; the daily ones go to members seen in the last ${activeWithinDays} days.`
      : 'Every automation and scheduled message is stopped.',
  };
}

/** One automation: on or off, its hour and days, its knobs and its words. */
export async function saveAutomation(_previous: AutomationActionState, form: FormData): Promise<AutomationActionState> {
  const key = text(form, 'key');
  const templates = json<AutomationRow['templates']>(form, 'templates');
  const params = json<Record<string, unknown>>(form, 'params');
  const weekdays = form.getAll('weekday').map(value => Number(value));
  if (!templates) return { error: 'The lines could not be read — reload the page and try again.' };

  const hour = text(form, 'hour');
  const result = await adminWrite<AutomationRow>('PUT', `/admin/automations/${encodeURIComponent(key)}`, {
    enabled: toggle(form, 'enabled'),
    ...(hour !== '' ? { hour: Number(hour) } : {}),
    ...(weekdays.length > 0 ? { weekdays } : {}),
    ...(params && Object.keys(params).length > 0 ? { params } : {}),
    templates,
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };
  changed();
  const saved = result.data;
  const live = saved.templates.filter(template => template.active).length;
  return { ok: `${saved.label}: ${saved.enabled ? 'on' : 'off'}, ${live} live line${live === 1 ? '' : 's'}.` };
}

/** Back to the code's own hour, days and words. */
export async function resetAutomation(_previous: AutomationActionState, form: FormData): Promise<AutomationActionState> {
  const key = text(form, 'key');
  if (text(form, 'confirm') !== 'reset') return { error: 'Type reset to confirm.' };
  const result = await adminWrite<AutomationRow>('DELETE', `/admin/automations/${encodeURIComponent(key)}`);
  if (!result.ok) return { error: result.error };
  changed();
  return { ok: `${result.data.label} is back on the defaults.` };
}

/** What it would say to one member, from their own figures — and, if asked, sends them that. */
export async function tryAutomation(_previous: AutomationActionState, form: FormData): Promise<AutomationActionState> {
  const key = text(form, 'key');
  const userId = text(form, 'userId');
  if (!userId) return { error: 'Which member? Paste their id from Members.' };
  const send = text(form, 'intent') === 'send';
  const result = await adminWrite<AutomationPreview>('POST', `/admin/automations/${encodeURIComponent(key)}/preview`, {
    userId,
    send,
  });
  if (!result.ok) return { error: result.error };
  const preview = result.data;
  if (send) {
    changed();
    return {
      preview,
      ok: preview.sent
        ? `Sent to that member (${preview.sent.push === 'sent' ? 'pushed' : `not pushed: ${preview.sent.push.replace(/_/g, ' ')}`}).`
        : 'Nothing was sent.',
    };
  }
  return { preview };
}

function campaignBody(form: FormData) {
  const segment: Record<string, unknown> = {};
  for (const key of ['tier', 'platform'] as const) {
    const value = text(form, key);
    if (value) segment[key] = value;
  }
  for (const key of ['seenWithinDays', 'notSeenForDays'] as const) {
    const value = text(form, key);
    if (value) segment[key] = Number(value);
  }
  if (toggle(form, 'pushableOnly')) segment.pushableOnly = true;
  const kind = text(form, 'kind') as 'once' | 'daily' | 'weekly';
  return {
    name: text(form, 'name'),
    category: text(form, 'category'),
    title: text(form, 'title'),
    message: text(form, 'message'),
    link: text(form, 'link') || null,
    segment,
    schedule: {
      kind,
      hour: Number(text(form, 'hour') || 0),
      ...(kind === 'once' ? { date: text(form, 'date') || null } : {}),
      ...(kind === 'weekly' ? { weekdays: form.getAll('weekday').map(value => Number(value)) } : {}),
    },
    startsOn: text(form, 'startsOn') || null,
    endsOn: text(form, 'endsOn') || null,
    enabled: toggle(form, 'enabled'),
    note: text(form, 'note') || undefined,
  };
}

/** Writes a scheduled message, new or existing. */
export async function saveCampaign(_previous: AutomationActionState, form: FormData): Promise<AutomationActionState> {
  const id = text(form, 'id');
  const body = campaignBody(form);
  if (!body.name || !body.title || !body.message) return { error: 'A name, a title and a message, all three.' };
  const result = id
    ? await adminWrite<CampaignRow>('PUT', `/admin/campaigns/${encodeURIComponent(id)}`, body)
    : await adminWrite<CampaignRow>('POST', '/admin/campaigns', body);
  if (!result.ok) return { error: result.error };
  changed();
  const saved = result.data;
  return { ok: `${saved.name}: ${saved.state === 'scheduled' ? 'scheduled' : saved.state}.` };
}

/** On or off, without retyping it: the rest of the message goes back exactly as it is. */
export async function toggleCampaign(_previous: AutomationActionState, form: FormData): Promise<AutomationActionState> {
  const campaign = json<CampaignRow>(form, 'campaign');
  if (!campaign) return { error: 'Reload the page and try again.' };
  const result = await adminWrite<CampaignRow>('PUT', `/admin/campaigns/${encodeURIComponent(campaign.id)}`, {
    name: campaign.name,
    category: campaign.category,
    title: campaign.title,
    message: campaign.message,
    link: campaign.link,
    segment: campaign.segment,
    schedule: {
      kind: campaign.schedule.kind,
      hour: campaign.schedule.hour,
      ...(campaign.schedule.kind === 'once' ? { date: campaign.schedule.date } : {}),
      ...(campaign.schedule.kind === 'weekly' ? { weekdays: campaign.schedule.weekdays } : {}),
    },
    startsOn: campaign.startsOn,
    endsOn: campaign.endsOn,
    enabled: !campaign.enabled,
  });
  if (!result.ok) return { error: result.error };
  changed();
  return { ok: result.data.enabled ? 'On.' : 'Off — nothing more goes out.' };
}

/** Deletes the schedule. What it already sent stays where it is. */
export async function deleteCampaign(_previous: AutomationActionState, form: FormData): Promise<AutomationActionState> {
  const id = text(form, 'id');
  if (text(form, 'confirm') !== 'delete') return { error: 'Type delete to confirm.' };
  const result = await adminWrite<{ deleted: true }>('DELETE', `/admin/campaigns/${encodeURIComponent(id)}`, {
    note: text(form, 'note') || undefined,
  });
  if (!result.ok) return { error: result.error };
  changed();
  return { ok: 'Deleted.' };
}
