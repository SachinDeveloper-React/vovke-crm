'use client';

import { useActionState, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import type { AutomationRow, AutomationTemplate, Automations, CampaignRow } from '@/src/lib/types';

import {
  deleteCampaign,
  resetAutomation,
  saveAutomation,
  saveAutomationSettings,
  saveCampaign,
  toggleCampaign,
  tryAutomation,
  type AutomationActionState,
} from './actions';
import { WEEKDAYS, hourLabel } from './labels';


function Said({ state }: { state: AutomationActionState }) {
  if (!state.ok && !state.error) return null;
  return (
    <Alert severity={state.error ? 'error' : 'success'} variant="outlined">
      {state.error ?? state.ok}
    </Alert>
  );
}

function WeekdayPicker({ value, disabled }: { value: number[]; disabled?: boolean }) {
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap' }}>
      {WEEKDAYS.map((label, index) => (
        <FormControlLabel
          key={label}
          control={<Checkbox name="weekday" value={index} defaultChecked={value.includes(index)} size="small" disabled={disabled} />}
          label={<Typography variant="body2">{label}</Typography>}
        />
      ))}
    </Stack>
  );
}

function HourPicker({ value, disabled, helperText }: { value: number; disabled?: boolean; helperText?: string }) {
  return (
    <TextField
      select
      name="hour"
      label="At (member's own clock)"
      size="small"
      fullWidth
      defaultValue={value}
      disabled={disabled}
      helperText={helperText}
    >
      {Array.from({ length: 24 }, (_, hour) => (
        <MenuItem key={hour} value={hour}>
          {hourLabel(hour)}
        </MenuItem>
      ))}
    </TextField>
  );
}

// ─── The rules over all of them ────────────────────────────────────────────

export function SettingsForm({ settings }: { settings: Automations['settings'] }) {
  const [state, action, pending] = useActionState<AutomationActionState, FormData>(saveAutomationSettings, {});
  return (
    <Stack component="form" action={action} spacing={2}>
      <Said state={state} />
      <input type="hidden" name="enabled" value="off" />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            name="maxPerDay"
            label="Most a member gets a day"
            type="number"
            size="small"
            fullWidth
            defaultValue={settings.maxPerDay}
            disabled={pending}
            slotProps={{ htmlInput: { min: 1, max: 10 } }}
            helperText={`Their own news (goal reached, saved reward ready) is never held back. Default ${settings.defaults.maxPerDay}.`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            name="activeWithinDays"
            label="Active means seen in the last … days"
            type="number"
            size="small"
            fullWidth
            defaultValue={settings.activeWithinDays}
            disabled={pending}
            slotProps={{ htmlInput: { min: 1, max: 365 } }}
            helperText={`Quieter members get the win-back, not the daily ones. Default ${settings.defaults.activeWithinDays}.`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField name="note" label="Why (for the log)" size="small" fullWidth disabled={pending} />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <FormControlLabel
          control={<Switch name="enabled" defaultChecked={settings.enabled} disabled={pending} color="success" />}
          label="Automated messages are on"
        />
        <Button type="submit" variant="contained" loading={pending}>
          Save
        </Button>
      </Stack>
    </Stack>
  );
}

// ─── One automation ────────────────────────────────────────────────────────

const TIP_TOPICS = ['health', 'motivation', 'hydration', 'nutrition'];

/** What each knob is called, in the operator's words. */
const PARAM_LABEL: Record<string, string> = {
  belowPercent: 'Only when under this % of their goal',
  afterDays: 'After this many days quiet (comma-separated)',
  tipTopic: 'Which tips (Quotes & tips screen)',
  cooldownDays: 'Not again within … days',
};

function newLineId(key: string, slot: string): string {
  return `${key.split('_')[0]}-${slot === 'default' ? '' : `${slot}-`}${Date.now().toString(36)}`.slice(0, 40);
}

export function AutomationForm({ automation }: { automation: AutomationRow }) {
  const [state, action, pending] = useActionState<AutomationActionState, FormData>(saveAutomation, {});
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<AutomationTemplate[]>(automation.templates);
  const [params, setParams] = useState<Record<string, unknown>>(automation.params);
  const [afterDaysText, setAfterDaysText] = useState(
    Array.isArray(automation.params.afterDays) ? (automation.params.afterDays as number[]).join(', ') : '',
  );

  const serialisedParams = useMemo(() => {
    const out: Record<string, unknown> = { ...params };
    if ('afterDays' in automation.paramsDefaults) {
      out.afterDays = afterDaysText
        .split(/[,\s]+/)
        .map(part => Number(part))
        .filter(value => Number.isInteger(value) && value > 0);
    }
    return JSON.stringify(out);
  }, [afterDaysText, automation.paramsDefaults, params]);

  const update = (index: number, patch: Partial<AutomationTemplate>) =>
    setTemplates(current => current.map((template, at) => (at === index ? { ...template, ...patch } : template)));

  return (
    <Stack spacing={2}>
      <Button
        size="small"
        color="inherit"
        onClick={() => setOpen(value => !value)}
        startIcon={<Iconify icon={open ? 'eva:chevron-up-fill' : 'eva:edit-2-outline'} />}
        sx={{ alignSelf: 'flex-start' }}
      >
        {open ? 'Close' : 'Change it'}
      </Button>

      <Collapse in={open} unmountOnExit>
        <Stack component="form" action={action} spacing={2.5}>
          <Said state={state} />
          <input type="hidden" name="key" value={automation.key} />
          <input type="hidden" name="enabled" value="off" />
          <input type="hidden" name="templates" value={JSON.stringify(templates)} />
          <input type="hidden" name="params" value={serialisedParams} />

          <Grid container spacing={2}>
            {automation.timing === 'hour' && automation.hour !== null && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <HourPicker value={automation.hour} disabled={pending} />
              </Grid>
            )}
            {Object.entries(automation.paramsDefaults).map(([key, fallback]) => (
              <Grid key={key} size={{ xs: 12, sm: 4 }}>
                {key === 'tipTopic' ? (
                  <TextField
                    select
                    label={PARAM_LABEL[key] ?? key}
                    size="small"
                    fullWidth
                    value={String(params[key] ?? fallback)}
                    onChange={event => setParams(current => ({ ...current, [key]: event.target.value }))}
                    disabled={pending}
                  >
                    {TIP_TOPICS.map(topic => (
                      <MenuItem key={topic} value={topic}>
                        {topic}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : Array.isArray(fallback) ? (
                  <TextField
                    label={PARAM_LABEL[key] ?? key}
                    size="small"
                    fullWidth
                    value={afterDaysText}
                    onChange={event => setAfterDaysText(event.target.value)}
                    disabled={pending}
                    helperText={`Default ${(fallback as number[]).join(', ')}`}
                  />
                ) : (
                  <TextField
                    label={PARAM_LABEL[key] ?? key}
                    type="number"
                    size="small"
                    fullWidth
                    value={String(params[key] ?? fallback)}
                    onChange={event => setParams(current => ({ ...current, [key]: Number(event.target.value) }))}
                    disabled={pending}
                    helperText={`Default ${String(fallback)}`}
                  />
                )}
              </Grid>
            ))}
            {automation.timing === 'hour' && (
              <Grid size={12}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  On these days (the member&apos;s own)
                </Typography>
                <WeekdayPicker value={automation.weekdays} disabled={pending} />
              </Grid>
            )}
          </Grid>

          {automation.slots.map(slot => (
            <Stack key={slot.key} spacing={1.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                <Typography variant="subtitle2">
                  {automation.slots.length > 1 ? slot.label : 'The lines'} — one is picked per member per day, in turn
                </Typography>
              </Stack>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {slot.variables.map(variable => (
                  <Chip key={variable} label={`{${variable}}`} size="small" variant="outlined" />
                ))}
                <Typography variant="caption" sx={{ color: 'text.disabled', alignSelf: 'center', ml: 1 }}>
                  [text in brackets] is left out when a value inside it is empty or zero
                </Typography>
              </Stack>

              {templates.map((template, index) =>
                template.slot !== slot.key ? null : (
                  <Box
                    key={`${template.id}-${index}`}
                    sx={{ p: 1.5, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider', opacity: template.active ? 1 : 0.6 }}
                  >
                    <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          label="Title"
                          size="small"
                          fullWidth
                          value={template.title}
                          onChange={event => update(index, { title: event.target.value })}
                          disabled={pending}
                          slotProps={{ htmlInput: { maxLength: 80 } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          label="Message"
                          size="small"
                          fullWidth
                          multiline
                          value={template.message}
                          onChange={event => update(index, { message: event.target.value })}
                          disabled={pending}
                          slotProps={{ htmlInput: { maxLength: 300 } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={template.active}
                                onChange={event => update(index, { active: event.target.checked })}
                                disabled={pending}
                              />
                            }
                            label={<Typography variant="caption">Live</Typography>}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="Remove this line"
                            onClick={() => setTemplates(current => current.filter((_, at) => at !== index))}
                            disabled={pending}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                          </IconButton>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                ),
              )}

              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() =>
                  setTemplates(current => [
                    ...current,
                    { id: newLineId(automation.key, slot.key), slot: slot.key, title: '', message: '', active: true },
                  ])
                }
                disabled={pending || templates.length >= 20}
                sx={{ alignSelf: 'flex-start' }}
              >
                Add a line
              </Button>
            </Stack>
          ))}

          <TextField name="note" label="Why (for the log)" size="small" fullWidth disabled={pending} />

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <FormControlLabel
              control={<Switch name="enabled" defaultChecked={automation.enabled} disabled={pending} color="success" />}
              label="On"
            />
            <Button type="submit" variant="contained" loading={pending}>
              Save
            </Button>
          </Stack>
        </Stack>
      </Collapse>
    </Stack>
  );
}

export function ResetAutomationForm({ automationKey }: { automationKey: string }) {
  const [state, action, pending] = useActionState<AutomationActionState, FormData>(resetAutomation, {});
  return (
    <Stack component="form" action={action} spacing={1}>
      <Said state={state} />
      <input type="hidden" name="key" value={automationKey} />
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <TextField name="confirm" label="Type reset" size="small" disabled={pending} sx={{ width: 140 }} />
        <Button type="submit" size="small" color="warning" variant="outlined" loading={pending}>
          Back to defaults
        </Button>
      </Stack>
    </Stack>
  );
}

export function TryAutomationForm({ automationKey }: { automationKey: string }) {
  const [state, action, pending] = useActionState<AutomationActionState, FormData>(tryAutomation, {});
  const preview = state.preview;
  return (
    <Stack component="form" action={action} spacing={1.5}>
      <input type="hidden" name="key" value={automationKey} />
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <TextField name="userId" label="Member id" size="small" disabled={pending} sx={{ minWidth: 260 }} />
        <Button type="submit" name="intent" value="preview" size="small" variant="outlined" loading={pending}>
          Show what they would get
        </Button>
        <Button type="submit" name="intent" value="send" size="small" color="warning" variant="outlined" loading={pending}>
          Send it to them now
        </Button>
      </Stack>
      <Said state={{ ok: state.ok, error: state.error }} />
      {preview && (
        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
          <Typography variant="subtitle2">{preview.title ?? '— no live line —'}</Typography>
          <Typography variant="body2">{preview.message ?? ''}</Typography>
          <Typography variant="caption" sx={{ color: preview.applies ? 'success.main' : 'text.disabled', display: 'block', mt: 0.5 }}>
            {preview.applies
              ? `Its reason holds for this member today (${preview.clock.day}, ${hourLabel(preview.clock.hour)} their time).`
              : 'Its reason does not hold for this member today — they would not get this now. Shown with what is known about them.'}
            {preview.link ? ` Opens: ${preview.link}.` : ''}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

// ─── Scheduled messages ────────────────────────────────────────────────────

const CATEGORY_HELP: Record<string, string> = {
  motivation: 'Motivation — the Tips & Motivation switch can silence it',
  information: 'Information — the Tips & Motivation switch can silence it',
  update: 'Update — the Announcements switch can silence it',
  offer: 'Offer — the Offers & Promotions switch can silence it',
};

export function CampaignForm({
  campaign,
  links,
  variables,
}: {
  campaign?: CampaignRow;
  links: string[];
  variables: string[];
}) {
  const [state, action, pending] = useActionState<AutomationActionState, FormData>(saveCampaign, {});
  const [open, setOpen] = useState(!campaign);
  const [kind, setKind] = useState<'once' | 'daily' | 'weekly'>(campaign?.schedule.kind ?? 'daily');
  const segment = campaign?.segment ?? {};

  return (
    <Stack spacing={2}>
      {campaign && (
        <Button
          size="small"
          color="inherit"
          onClick={() => setOpen(value => !value)}
          startIcon={<Iconify icon={open ? 'eva:chevron-up-fill' : 'eva:edit-2-outline'} />}
          sx={{ alignSelf: 'flex-start' }}
        >
          {open ? 'Close' : 'Edit it'}
        </Button>
      )}
      <Collapse in={open} unmountOnExit>
        <Stack component="form" action={action} spacing={2}>
          <Said state={state} />
          {campaign && <input type="hidden" name="id" value={campaign.id} />}
          <input type="hidden" name="enabled" value="off" />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField name="name" label="Name (only you see it)" size="small" fullWidth required defaultValue={campaign?.name ?? ''} disabled={pending} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select name="category" label="Kind" size="small" fullWidth defaultValue={campaign?.category ?? 'motivation'} disabled={pending}>
                {Object.entries(CATEGORY_HELP).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField name="title" label="Title" size="small" fullWidth required defaultValue={campaign?.title ?? ''} disabled={pending} slotProps={{ htmlInput: { maxLength: 120 } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                name="message"
                label="Message"
                size="small"
                fullWidth
                required
                multiline
                defaultValue={campaign?.message ?? ''}
                disabled={pending}
                slotProps={{ htmlInput: { maxLength: 500 } }}
                helperText={`Can use ${variables.map(name => `{${name}}`).join(', ')}; [text in brackets] is left out when a value inside is empty.`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="link"
                label="Opens (optional)"
                size="small"
                fullWidth
                defaultValue={campaign?.link ?? ''}
                disabled={pending}
                helperText={`One of ${links.join(', ')}`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                name="kind"
                label="When"
                size="small"
                fullWidth
                value={kind}
                onChange={event => setKind(event.target.value as 'once' | 'daily' | 'weekly')}
                disabled={pending}
              >
                <MenuItem value="once">Once, on a date</MenuItem>
                <MenuItem value="daily">Every day</MenuItem>
                <MenuItem value="weekly">On chosen weekdays</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <HourPicker value={campaign?.schedule.hour ?? 10} disabled={pending} />
            </Grid>
            {kind === 'once' && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  name="date"
                  label="Date (the member's own)"
                  type="date"
                  size="small"
                  fullWidth
                  defaultValue={campaign?.schedule.date ?? ''}
                  disabled={pending}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            )}
            {kind === 'weekly' && (
              <Grid size={12}>
                <WeekdayPicker value={campaign?.schedule.weekdays ?? [0]} disabled={pending} />
              </Grid>
            )}
            {kind !== 'once' && (
              <>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField name="startsOn" label="From (optional)" type="date" size="small" fullWidth defaultValue={campaign?.startsOn ?? ''} disabled={pending} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField name="endsOn" label="Until (optional)" type="date" size="small" fullWidth defaultValue={campaign?.endsOn ?? ''} disabled={pending} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
              </>
            )}

            <Grid size={12}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Who — the same filters as Messages; empty is everybody
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select name="tier" label="Trust tier" size="small" fullWidth defaultValue={String(segment.tier ?? '')} disabled={pending}>
                <MenuItem value="">Any</MenuItem>
                {['trusted', 'normal', 'watch', 'restricted', 'banned'].map(tier => (
                  <MenuItem key={tier} value={tier}>
                    {tier}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select name="platform" label="Platform" size="small" fullWidth defaultValue={String(segment.platform ?? '')} disabled={pending}>
                <MenuItem value="">Any phone</MenuItem>
                <MenuItem value="android">Android</MenuItem>
                <MenuItem value="ios">iOS</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField name="seenWithinDays" label="Seen within days" type="number" size="small" fullWidth defaultValue={segment.seenWithinDays ?? ''} disabled={pending} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField name="notSeenForDays" label="Quiet for days" type="number" size="small" fullWidth defaultValue={segment.notSeenForDays ?? ''} disabled={pending} />
            </Grid>
            <Grid size={12}>
              <TextField name="note" label="Why (for the log)" size="small" fullWidth disabled={pending} />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <FormControlLabel control={<Switch name="pushableOnly" defaultChecked={Boolean(segment.pushableOnly)} disabled={pending} />} label="Only phones that can show a push" />
            <FormControlLabel control={<Switch name="enabled" defaultChecked={campaign?.enabled ?? true} disabled={pending} color="success" />} label="On" />
            <Button type="submit" variant="contained" loading={pending}>
              {campaign ? 'Save it' : 'Schedule it'}
            </Button>
          </Stack>
        </Stack>
      </Collapse>
    </Stack>
  );
}

export function CampaignQuickEdit({ campaign }: { campaign: CampaignRow }) {
  const [toggleState, toggleAction, togglePending] = useActionState<AutomationActionState, FormData>(toggleCampaign, {});
  const [deleteState, deleteAction, deletePending] = useActionState<AutomationActionState, FormData>(deleteCampaign, {});
  return (
    <Stack spacing={1} sx={{ minWidth: 220 }}>
      <Said state={toggleState} />
      <Said state={deleteState} />
      <Stack component="form" action={toggleAction}>
        <input type="hidden" name="campaign" value={JSON.stringify(campaign)} />
        <Button type="submit" size="small" variant="outlined" color={campaign.enabled ? 'warning' : 'success'} loading={togglePending}>
          {campaign.enabled ? 'Turn off' : 'Turn on'}
        </Button>
      </Stack>
      <Stack component="form" action={deleteAction} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <input type="hidden" name="id" value={campaign.id} />
        <TextField name="confirm" label="Type delete" size="small" disabled={deletePending} sx={{ flex: 1 }} />
        <Button type="submit" size="small" color="error" variant="outlined" loading={deletePending}>
          Delete
        </Button>
      </Stack>
    </Stack>
  );
}
