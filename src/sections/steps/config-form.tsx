'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { Label } from '@/src/components/label';

import { saveStepsConfig, type ConfigState } from './actions';
import { at, nest, type ConfigField, type ConfigGroup } from './fields';

/** What a field holds while it is being edited: everything is a string but a switch. */
type Draft = Record<string, string | boolean>;

const toDraft = (field: ConfigField, value: unknown): string | boolean => {
  if (field.kind === 'boolean') return value === true;
  if (field.kind === 'list') return Array.isArray(value) ? value.join('\n') : '';
  if (field.kind === 'nullableBoolean') return value === null || value === undefined ? '' : String(value);
  return value === null || value === undefined ? '' : String(value);
};

/** And what it becomes on the way to the API. */
function fromDraft(field: ConfigField, draft: string | boolean): unknown {
  switch (field.kind) {
    case 'boolean':
      return draft === true;
    case 'list':
      return String(draft)
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    case 'nullableBoolean':
      return draft === '' ? null : draft === 'true';
    case 'nullableDecimal':
      return draft === '' ? null : Number(draft);
    case 'number':
    case 'decimal':
      return Number(draft);
    default:
      return draft;
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * One section of the step config, as a form.
 *
 * Only what the operator actually touched is sent: the draft is a sparse
 * map of edits over the effective config, so two people changing two
 * sections at the same time cannot overwrite each other, and a field left
 * alone is never written at all.
 *
 * The form holds no snapshot of "what it was": dirty is measured against
 * the props, so once the save has gone through and the page has re-read,
 * the same drafts stop being changes and the button goes quiet on its own.
 */
export function ConfigSection({
  group,
  effective,
  defaults,
  overridden,
}: {
  group: ConfigGroup;
  effective: Record<string, unknown>;
  defaults: Record<string, unknown>;
  overridden: string[];
}) {
  const [state, action, pending] = useActionState<ConfigState, FormData>(saveStepsConfig, {});
  const [draft, setDraft] = useState<Draft>({});
  const [resetting, setResetting] = useState<string[]>([]);

  const current = (field: ConfigField) =>
    field.path in draft ? draft[field.path] : toDraft(field, at(effective, field.path));

  const changes = group.fields.filter(field => {
    if (!(field.path in draft)) return false;
    return !same(fromDraft(field, draft[field.path]), at(effective, field.path));
  });

  const patch = nest(Object.fromEntries(changes.map(field => [field.path, fromDraft(field, draft[field.path])])));
  const grave = changes.some(field => field.grave);

  return (
    <Stack component="form" action={action} spacing={2}>
      <input type="hidden" name="patch" value={JSON.stringify(patch)} />
      <input type="hidden" name="reset" value={JSON.stringify(resetting)} />
      <input type="hidden" name="label" value={group.title} />

      {state.ok && (
        <Alert severity="success" variant="outlined">
          {state.ok}
        </Alert>
      )}
      {state.error && (
        <Alert severity="error" variant="outlined">
          {state.error}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        {group.fields.map(field => {
          const isOverridden = overridden.includes(field.path);
          const value = current(field);
          const wide = field.kind === 'list';
          return (
            <Grid key={field.path} size={{ xs: 12, md: wide ? 12 : 6, lg: wide ? 12 : 4 }}>
              <Stack spacing={0.5}>
                {field.kind === 'boolean' ? (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={value === true}
                        disabled={pending}
                        onChange={event => setDraft(prev => ({ ...prev, [field.path]: event.target.checked }))}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: field.grave ? 'error.main' : 'text.primary' }}>
                        {field.label}
                      </Typography>
                    }
                  />
                ) : field.kind === 'select' || field.kind === 'nullableBoolean' ? (
                  <TextField
                    select
                    size="small"
                    label={field.label}
                    value={String(value)}
                    disabled={pending}
                    onChange={event => setDraft(prev => ({ ...prev, [field.path]: event.target.value }))}
                  >
                    {(field.options ?? []).map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : field.kind === 'list' ? (
                  <TextField
                    size="small"
                    label={field.label}
                    value={String(value)}
                    disabled={pending}
                    multiline
                    minRows={3}
                    slotProps={{ htmlInput: { spellCheck: false, style: { fontFamily: 'var(--font-geist-mono)', fontSize: 12.5 } } }}
                    onChange={event => setDraft(prev => ({ ...prev, [field.path]: event.target.value }))}
                  />
                ) : (
                  <TextField
                    size="small"
                    type="number"
                    label={field.label}
                    value={String(value)}
                    disabled={pending}
                    slotProps={{
                      htmlInput: { min: field.min, max: field.max, step: field.step ?? (field.kind === 'number' ? 1 : 'any') },
                      input: field.unit
                        ? {
                            endAdornment: (
                              <Typography variant="caption" sx={{ color: 'text.disabled', whiteSpace: 'nowrap', pl: 1 }}>
                                {field.unit}
                              </Typography>
                            ),
                          }
                        : undefined,
                    }}
                    onChange={event => setDraft(prev => ({ ...prev, [field.path]: event.target.value }))}
                  />
                )}

                {field.help && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {field.help}
                  </Typography>
                )}

                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  {isOverridden && (
                    <>
                      <Tooltip title={`The code ships ${JSON.stringify(at(defaults, field.path))}`}>
                        <span>
                          <Label color="info" variant="soft">
                            overridden
                          </Label>
                        </span>
                      </Tooltip>
                      <Button
                        type="submit"
                        size="small"
                        variant="text"
                        disabled={pending}
                        onClick={() => {
                          setResetting([field.path]);
                          setDraft(prev => {
                            const next = { ...prev };
                            delete next[field.path];
                            return next;
                          });
                        }}
                        sx={{ minWidth: 0, px: 0.5 }}
                      >
                        put back to default
                      </Button>
                    </>
                  )}
                  {field.path in draft && !same(fromDraft(field, draft[field.path]), at(effective, field.path)) && (
                    <Label color="warning" variant="soft">
                      unsaved
                    </Label>
                  )}
                </Stack>
              </Stack>
            </Grid>
          );
        })}
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Button
          type="submit"
          variant="contained"
          color={grave ? 'warning' : 'primary'}
          loading={pending}
          disabled={changes.length === 0}
          startIcon={<Iconify icon="solar:diskette-bold-duotone" />}
          onClick={() => setResetting([])}
        >
          {changes.length === 0 ? 'Nothing to save' : `Save ${changes.length} change${changes.length === 1 ? '' : 's'}`}
        </Button>
        {changes.length > 0 && (
          <Button size="small" color="inherit" disabled={pending} onClick={() => setDraft({})}>
            Discard
          </Button>
        )}
        {grave && (
          <Typography variant="caption" sx={{ color: 'warning.main' }}>
            One of these changes what members are paid or what a day is judged by. It takes effect on every server within
            thirty seconds.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
