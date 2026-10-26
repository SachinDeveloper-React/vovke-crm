'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import type { TipRow } from '@/src/lib/types';

import { addTips, deleteTip, patchTip, saveTip, type QuoteActionState } from './quote-actions';

function Said({ state, small = false }: { state: QuoteActionState; small?: boolean }) {
  if (!state.ok && !state.error) return null;
  return (
    <Alert severity={state.error ? 'error' : 'success'} variant="outlined" sx={small ? { py: 0 } : undefined}>
      {small ? <Typography variant="caption">{state.error ?? state.ok}</Typography> : (state.error ?? state.ok)}
    </Alert>
  );
}

/** Which screens take a heading as well as a line. */
const WITH_HEADING = ['reminders', 'heart_rate', 'blood_pressure'];

/**
 * Writing one line.
 *
 * The heading is optional because the cards are not all the same shape: the
 * home screen's quote and the water tip are a line on their own, while the
 * reminder plan's note and the two vital screens' advice are drawn with a
 * heading above them. Writing a heading for a card that has nowhere to draw
 * it is the one mistake this form can make, so it says which is which.
 */
export function TipForm({ topics, tip }: { topics: string[]; tip?: TipRow }) {
  const [state, action, pending] = useActionState<QuoteActionState, FormData>(saveTip, {});
  const [open, setOpen] = useState(!tip);
  const [topic, setTopic] = useState(tip?.topic ?? topics[0] ?? 'motivation');

  return (
    <Stack spacing={2}>
      {tip && (
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
          <input type="hidden" name="active" value="off" />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="id"
                label="Id"
                size="small"
                fullWidth
                required
                defaultValue={tip?.id ?? ''}
                disabled={pending || Boolean(tip)}
                helperText={tip ? 'Fixed' : 'motivation-6'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                select
                name="topic"
                label="Where it shows"
                size="small"
                fullWidth
                value={topic}
                onChange={event => setTopic(event.target.value)}
                disabled={pending || Boolean(tip)}
              >
                {topics.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                name="sort"
                label="Order"
                type="number"
                size="small"
                fullWidth
                defaultValue={tip?.sort ?? 0}
                disabled={pending}
                helperText="Lower first"
              />
            </Grid>

            <Grid size={12}>
              <TextField
                name="title"
                label="Heading"
                size="small"
                fullWidth
                defaultValue={tip?.title ?? ''}
                disabled={pending}
                helperText={
                  WITH_HEADING.includes(topic)
                    ? 'This card draws a heading above the line'
                    : 'Leave it empty — this card is the line on its own'
                }
              />
            </Grid>

            <Grid size={12}>
              <TextField
                name="text"
                label="The line"
                size="small"
                fullWidth
                required
                multiline
                minRows={2}
                defaultValue={tip?.text ?? ''}
                disabled={pending}
                helperText="In the app's own voice, and short enough to read at a glance"
              />
            </Grid>

            <Grid size={12}>
              <TextField
                name="note"
                label="Why (for the log)"
                size="small"
                fullWidth
                disabled={pending}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <FormControlLabel
              control={<Switch name="active" defaultChecked={tip?.active ?? true} disabled={pending} />}
              label="In the rotation"
            />
            <Button type="submit" variant="contained" loading={pending}>
              {tip ? 'Save it' : 'Write it'}
            </Button>
          </Stack>
        </Stack>
      </Collapse>
    </Stack>
  );
}

/**
 * A list of lines for one screen at once.
 *
 * Headings are not offered here on purpose: a pasted list is twenty lines
 * of the same shape, and a heading belongs to one line at a time — add it
 * afterwards on the row that needs it.
 */
export function BulkTipsForm({ topics }: { topics: string[] }) {
  const [state, action, pending] = useActionState<QuoteActionState, FormData>(addTips, {});

  return (
    <Stack component="form" action={action} spacing={2}>
      <Said state={state} />
      <input type="hidden" name="active" value="off" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            select
            name="topic"
            label="Where they show"
            size="small"
            fullWidth
            defaultValue={topics[0] ?? 'motivation'}
            disabled={pending}
          >
            {topics.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 7 }}>
          <TextField name="note" label="Why (for the log)" size="small" fullWidth disabled={pending} />
        </Grid>
        <Grid size={12}>
          <TextField
            name="lines"
            label="One line per row"
            size="small"
            fullWidth
            required
            multiline
            minRows={6}
            disabled={pending}
            helperText="Each becomes its own line, added at the end of that screen's rotation. A line the screen already has, word for word, is skipped."
          />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <FormControlLabel
          control={<Switch name="active" defaultChecked disabled={pending} />}
          label="In the rotation"
        />
        <Button type="submit" variant="contained" loading={pending}>
          Add them
        </Button>
      </Stack>
    </Stack>
  );
}

/** The order, whether it shows, and the way out. */
export function TipQuickEdit({ tip }: { tip: TipRow }) {
  const [patchState, patchAction, patchPending] = useActionState<QuoteActionState, FormData>(patchTip, {});
  const [deleteState, deleteAction, deletePending] = useActionState<QuoteActionState, FormData>(deleteTip, {});

  return (
    <Stack spacing={1} sx={{ minWidth: 230 }}>
      <Said state={patchState} small />
      <Said state={deleteState} small />

      <Stack component="form" action={patchAction} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <input type="hidden" name="id" value={tip.id} />
        <input type="hidden" name="active" value="off" />
        <TextField
          name="sort"
          label="#"
          type="number"
          size="small"
          defaultValue={tip.sort}
          disabled={patchPending}
          sx={{ width: 80 }}
        />
        <FormControlLabel
          control={<Switch name="active" size="small" defaultChecked={tip.active} disabled={patchPending} />}
          label={<Typography variant="caption">Show</Typography>}
          sx={{ mr: 0 }}
        />
        <Button type="submit" size="small" variant="outlined" loading={patchPending}>
          Set
        </Button>
      </Stack>

      <Stack component="form" action={deleteAction} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <input type="hidden" name="id" value={tip.id} />
        <TextField name="confirm" label={`Type ${tip.id}`} size="small" disabled={deletePending} sx={{ flex: 1 }} />
        <Button type="submit" size="small" color="error" variant="outlined" loading={deletePending}>
          Delete
        </Button>
      </Stack>
    </Stack>
  );
}
