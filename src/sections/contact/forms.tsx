'use client';

import { startTransition, useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';

import { contactAction, type ContactActionState } from './actions';
import { CONTACT_GROUPS, namesRetiredDomain, showField, type ContactField } from './fields';

function Said({ state }: { state: ContactActionState }) {
  return (
    <>
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
    </>
  );
}

const INPUT_TYPE: Partial<Record<ContactField['kind'], string>> = { email: 'email', phone: 'tel', url: 'url' };

/**
 * One group of contact details, saved together.
 *
 * The boxes are uncontrolled and the form is keyed on the values it was
 * drawn with, so after a save — when the page comes back with what the
 * server now holds — the boxes show that, not what was typed. A box whose
 * value has parted from the code's carries the shipped one under it and a
 * way back to it.
 */
export function ContactGroupForm({
  groupId,
  values,
  shipped,
}: {
  groupId: string;
  /** Path → what is in force. */
  values: Record<string, unknown>;
  /** Path → what the code ships. */
  shipped: Record<string, unknown>;
}) {
  const group = CONTACT_GROUPS.find(entry => entry.id === groupId)!;
  const [state, act, busy] = useActionState<ContactActionState, FormData>(contactAction, {});

  // Not a submit button: pressing Enter in a box submits the form with its
  // first submit button, and that must be Save, never a reset.
  const putBack = (path: string) => () => {
    const data = new FormData();
    data.set('reset', path);
    startTransition(() => act(data));
  };

  return (
    <Stack component="form" action={act} spacing={2} key={JSON.stringify(values)}>
      <Said state={state} />
      <input type="hidden" name="group" value={group.id} />
      <Grid container spacing={2}>
        {group.fields.map(field => {
          const value = values[field.path];
          const parted = JSON.stringify(value ?? null) !== JSON.stringify(shipped[field.path] ?? null);
          const retired = namesRetiredDomain(value);
          const helper = (
            <Stack component="span" spacing={0.25} sx={{ display: 'flex' }}>
              <span>{field.shows}</span>
              {retired && (
                <Typography component="span" variant="caption" sx={{ color: 'error.main' }}>
                  Still on vokve.app, a domain the company does not own — change it or put it back to the default.
                </Typography>
              )}
              {parted && (
                <Typography component="span" variant="caption" sx={{ color: 'warning.main' }}>
                  Default: {showField(field, shipped[field.path]).replace(/\n/g, ' · ') || 'empty'}
                </Typography>
              )}
            </Stack>
          );

          return (
            <Grid key={field.path} size={{ xs: 12, md: field.kind === 'lines' ? 12 : 6 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                {field.kind === 'switch' ? (
                  <Stack sx={{ flex: 1 }}>
                    <FormControlLabel
                      control={<Switch name={field.path} defaultChecked={value === true} disabled={busy} />}
                      label={field.label}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', pl: 1 }}>
                      {helper}
                    </Typography>
                  </Stack>
                ) : (
                  <TextField
                    name={field.path}
                    label={field.label}
                    defaultValue={showField(field, value)}
                    placeholder={field.placeholder}
                    type={INPUT_TYPE[field.kind] ?? 'text'}
                    multiline={field.kind === 'lines'}
                    minRows={field.kind === 'lines' ? 2 : undefined}
                    fullWidth
                    size="small"
                    required={!field.nullable && field.kind !== 'lines'}
                    disabled={busy}
                    error={retired}
                    helperText={helper}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
                {parted && (
                  <Button
                    type="button"
                    onClick={putBack(field.path)}
                    size="small"
                    color="inherit"
                    disabled={busy}
                    startIcon={<Iconify icon="solar:restart-bold-duotone" />}
                    sx={{ flexShrink: 0, mt: 0.5 }}
                  >
                    Default
                  </Button>
                )}
              </Stack>
            </Grid>
          );
        })}
      </Grid>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Button type="submit" variant="contained" loading={busy} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          Save {group.title.toLowerCase()}
        </Button>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Only what you changed is saved. The app reads it the next time the screen opens — no update needed.
        </Typography>
      </Stack>
    </Stack>
  );
}
