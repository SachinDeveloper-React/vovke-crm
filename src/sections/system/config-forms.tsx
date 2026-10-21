'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';

import { resetConfigKey, setConfigKey, type ConfigActionState } from './config-actions';

/** What kind of box a key gets, from the value it currently holds. */
export type ConfigKind = 'boolean' | 'number' | 'string' | 'json';

/**
 * One config key, as something to turn.
 *
 * Deliberately one row per key rather than a form per section: the config is
 * eighty-odd knobs across fourteen sections, nobody edits a section, and a
 * row that carries its own path, its current value and its default is the
 * whole of what somebody needs to change one thing and see what they
 * changed it from.
 *
 * The box's *kind* comes from the value the key holds, so a number key
 * cannot be given a string by accident — and the API refuses it anyway,
 * against the shape of the defaults, which is the check that actually
 * matters.
 */
export function ConfigKeyRow({
  path,
  value,
  shipped,
  kind,
  nullable,
}: {
  path: string;
  value: unknown;
  shipped: unknown;
  kind: ConfigKind;
  nullable: boolean;
}) {
  const [setState, setAction, setPending] = useActionState<ConfigActionState, FormData>(setConfigKey, {});
  const [resetState, resetAction, resetPending] = useActionState<ConfigActionState, FormData>(resetConfigKey, {});
  const asText = (input: unknown): string =>
    input === null || input === undefined ? '' : typeof input === 'object' ? JSON.stringify(input, null, 0) : String(input);
  const [draft, setDraft] = useState(asText(value));

  const changed = JSON.stringify(value) !== JSON.stringify(shipped);
  const said = setState.ok || resetState.ok;
  const wrong = setState.error || resetState.error;

  return (
    <Stack spacing={0.75} sx={{ minWidth: 0 }}>
      {said && (
        <Alert severity="success" variant="outlined" sx={{ py: 0 }}>
          <Typography variant="caption">{said}</Typography>
        </Alert>
      )}
      {wrong && (
        <Alert severity="error" variant="outlined" sx={{ py: 0 }}>
          <Typography variant="caption">{wrong}</Typography>
        </Alert>
      )}

      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 0.5 }}>
        <Stack component="form" action={setAction} direction="row" spacing={0.5} sx={{ alignItems: 'flex-start', flex: 1, minWidth: 220 }}>
          <input type="hidden" name="path" value={path} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="note" value="config edit" />
          {kind === 'boolean' ? (
            <TextField
              select
              name="value"
              size="small"
              value={draft === 'true' ? 'true' : 'false'}
              onChange={event => setDraft(event.target.value)}
              disabled={setPending}
              sx={{ width: 110 }}
            >
              <MenuItem value="true">on</MenuItem>
              <MenuItem value="false">off</MenuItem>
            </TextField>
          ) : (
            <TextField
              name="value"
              size="small"
              fullWidth
              multiline={kind === 'json' || draft.length > 60}
              maxRows={6}
              type={kind === 'number' ? 'number' : 'text'}
              value={draft}
              onChange={event => setDraft(event.target.value)}
              disabled={setPending}
              placeholder={nullable ? 'empty for none' : undefined}
              slotProps={kind === 'number' ? { htmlInput: { step: 'any' } } : undefined}
            />
          )}
          <Button type="submit" size="small" variant="outlined" loading={setPending}>
            Set
          </Button>
        </Stack>

        {changed && (
          <Stack component="form" action={resetAction}>
            <input type="hidden" name="path" value={path} />
            <input type="hidden" name="note" value="back to the default" />
            <Button
              type="submit"
              size="small"
              color="inherit"
              loading={resetPending}
              startIcon={<Iconify icon="solar:restart-bold-duotone" />}
            >
              Default
            </Button>
          </Stack>
        )}
      </Stack>

      {changed && (
        <Typography variant="caption" sx={{ color: 'warning.main' }}>
          the code ships {asText(shipped) || 'nothing'}
        </Typography>
      )}
    </Stack>
  );
}
