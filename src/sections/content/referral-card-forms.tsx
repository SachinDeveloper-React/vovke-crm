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
import type { ReferralCardRow } from '@/src/lib/types';

import {
  deleteReferralCard,
  patchReferralCard,
  saveReferralCard,
  type ReferralCardActionState,
} from './referral-card-actions';

function Said({ state, small = false }: { state: ReferralCardActionState; small?: boolean }) {
  if (!state.ok && !state.error) return null;
  return (
    <Alert severity={state.error ? 'error' : 'success'} variant="outlined" sx={small ? { py: 0 } : undefined}>
      {small ? <Typography variant="caption">{state.error ?? state.ok}</Typography> : (state.error ?? state.ok)}
    </Alert>
  );
}

/**
 * Writing one card.
 *
 * `position` is the field somebody comes back for: a banner at the foot of
 * the scroll is one nobody reaches, and the three anchors are each a real gap
 * the screen was built to open, so moving it is a choice rather than a
 * release.
 *
 * The reward is not a field, and the helper text says why: write `{coins}`
 * and the server puts in what it is actually paying per friend. A number
 * typed here would be a number that keeps being right only until somebody
 * changes `coins.referral`, and the card is a promise.
 */
export function ReferralCardForm({
  screens,
  accents,
  positions,
  card,
}: {
  screens: string[];
  accents: string[];
  positions: string[];
  card?: ReferralCardRow;
}) {
  const [state, action, pending] = useActionState<ReferralCardActionState, FormData>(saveReferralCard, {});
  const [open, setOpen] = useState(!card);

  return (
    <Stack spacing={2}>
      {card && (
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
                defaultValue={card?.id ?? ''}
                disabled={pending || Boolean(card)}
                helperText={card ? 'Fixed' : 'home-invite-1'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                select
                name="screen"
                label="Which screen"
                size="small"
                fullWidth
                defaultValue={card?.screen ?? screens[0] ?? 'home'}
                disabled={pending || Boolean(card)}
                helperText="Each one is a spot the app was built to draw it in"
              >
                {screens.map(option => (
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
                defaultValue={card?.sort ?? 0}
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
                required
                defaultValue={card?.title ?? ''}
                disabled={pending}
                helperText="Short — it is the first thing read. {coins} becomes the reward."
              />
            </Grid>

            <Grid size={12}>
              <TextField
                name="message"
                label="The pitch"
                size="small"
                fullWidth
                required
                multiline
                minRows={2}
                defaultValue={card?.message ?? ''}
                disabled={pending}
                helperText="{coins} is what the member earns per friend and {friendCoins} what the friend gets — both filled in by the server from what it is actually paying, so the card cannot promise coins nobody receives."
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                name="ctaLabel"
                label="The button"
                size="small"
                fullWidth
                defaultValue={card?.ctaLabel ?? ''}
                disabled={pending}
                helperText="Invite friends"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                name="accent"
                label="Colour"
                size="small"
                fullWidth
                defaultValue={card?.accent ?? accents[0] ?? 'brand'}
                disabled={pending}
                helperText="A name; the app owns the shade in each theme"
              >
                {accents.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                select
                name="position"
                label="Where on the screen"
                size="small"
                fullWidth
                defaultValue={card?.position ?? 'bottom'}
                disabled={pending}
                helperText="Top is under the screen's own headline, middle after its first block of content, bottom at the foot of the scroll"
              >
                {positions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                name="emoji"
                label="Glyph"
                size="small"
                fullWidth
                defaultValue={card?.emoji ?? ''}
                disabled={pending}
                helperText="One, like 🎁"
              />
            </Grid>

            <Grid size={12}>
              <TextField name="note" label="Why (for the log)" size="small" fullWidth disabled={pending} />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <FormControlLabel
              control={<Switch name="active" defaultChecked={card?.active ?? true} disabled={pending} />}
              label="Live on that screen"
            />
            <Button type="submit" variant="contained" loading={pending}>
              {card ? 'Save it' : 'Write it'}
            </Button>
          </Stack>
        </Stack>
      </Collapse>
    </Stack>
  );
}

/** The order, whether it shows, and the way out. */
export function ReferralCardQuickEdit({ card }: { card: ReferralCardRow }) {
  const [patchState, patchAction, patchPending] = useActionState<ReferralCardActionState, FormData>(
    patchReferralCard,
    {},
  );
  const [deleteState, deleteAction, deletePending] = useActionState<ReferralCardActionState, FormData>(
    deleteReferralCard,
    {},
  );

  return (
    <Stack spacing={1} sx={{ minWidth: 230 }}>
      <Said state={patchState} small />
      <Said state={deleteState} small />

      <Stack component="form" action={patchAction} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <input type="hidden" name="id" value={card.id} />
        <input type="hidden" name="active" value="off" />
        <TextField
          name="sort"
          label="#"
          type="number"
          size="small"
          defaultValue={card.sort}
          disabled={patchPending}
          sx={{ width: 80 }}
        />
        <FormControlLabel
          control={<Switch name="active" size="small" defaultChecked={card.active} disabled={patchPending} />}
          label={<Typography variant="caption">Show</Typography>}
          sx={{ mr: 0 }}
        />
        <Button type="submit" size="small" variant="outlined" loading={patchPending}>
          Set
        </Button>
      </Stack>

      <Stack component="form" action={deleteAction} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <input type="hidden" name="id" value={card.id} />
        <TextField name="confirm" label={`Type ${card.id}`} size="small" disabled={deletePending} sx={{ flex: 1 }} />
        <Button type="submit" size="small" color="error" variant="outlined" loading={deletePending}>
          Delete
        </Button>
      </Stack>
    </Stack>
  );
}
