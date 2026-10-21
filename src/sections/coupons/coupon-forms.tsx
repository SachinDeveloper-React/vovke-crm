'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
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
import { Label } from '@/src/components/label';
import { number, rupees } from '@/src/lib/format';
import type { Coupon } from '@/src/lib/types';

import { deleteCoupon, patchCoupon, saveCoupon, setCouponActive, type CouponActionState } from './actions';

/**
 * Writing a campaign (RULES R16).
 *
 * The form exists for the three fields that decide what a campaign costs and
 * were previously left at whatever a hand-written document happened to carry:
 * the cap on a percent coupon, the total ceiling, and the per-member limit.
 * Each says in its helper text what leaving it empty means, because "no
 * limit" is a decision and an empty box does not look like one.
 *
 * The dates arrive already formatted for the input, in the panel's own zone —
 * see `localInputValue`.
 */
export function CouponForm({
  coupon,
  startsAt = '',
  endsAt = '',
  couponsEnabled,
}: {
  coupon?: Coupon;
  /** `YYYY-MM-DDTHH:mm`, formatted on the server in the operator's zone. */
  startsAt?: string;
  endsAt?: string;
  couponsEnabled: boolean;
}) {
  const [state, action, pending] = useActionState<CouponActionState, FormData>(saveCoupon, {});
  const [open, setOpen] = useState(!coupon);
  const [kind, setKind] = useState<'percent' | 'flat'>(coupon?.kind ?? 'percent');

  return (
    <Stack spacing={2}>
      {coupon && (
        <Button
          size="small"
          color="inherit"
          onClick={() => setOpen(value => !value)}
          startIcon={<Iconify icon={open ? 'eva:chevron-up-fill' : 'eva:edit-2-outline'} />}
          sx={{ alignSelf: 'flex-start' }}
        >
          {open ? 'Close' : 'Edit everything'}
        </Button>
      )}

      <Collapse in={open} unmountOnExit>
        <Stack component="form" action={action} spacing={2}>
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
          {!couponsEnabled && (
            <Alert severity="warning" variant="outlined">
              Coupons are switched off for the whole shop (⚙ <code>commerce.couponsEnabled</code>), so nothing written
              here will apply to anybody until that is turned back on.
            </Alert>
          )}

          <input type="hidden" name="active" value="off" />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="code"
                label="Code"
                size="small"
                fullWidth
                required
                defaultValue={coupon?.code ?? ''}
                disabled={pending || Boolean(coupon)}
                helperText={coupon ? 'Fixed: orders hold it' : 'SUMMER10 — upper-cased on save'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                name="title"
                label="What the member reads"
                size="small"
                fullWidth
                required
                defaultValue={coupon?.title ?? ''}
                disabled={pending}
                helperText="Shown on the basket — “10% off, up to ₹150”"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                name="kind"
                label="Takes off"
                size="small"
                fullWidth
                value={kind}
                onChange={event => setKind(event.target.value as 'percent' | 'flat')}
                disabled={pending}
              >
                <MenuItem value="percent">A share of the goods</MenuItem>
                <MenuItem value="flat">A fixed amount</MenuItem>
              </TextField>
            </Grid>

            {kind === 'percent' ? (
              <>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    name="percentValue"
                    label="Percent off"
                    type="number"
                    size="small"
                    fullWidth
                    required
                    defaultValue={coupon?.kind === 'percent' ? coupon.value : ''}
                    disabled={pending}
                    slotProps={{ htmlInput: { min: 1, max: 100, step: 1 } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    name="maxDiscount"
                    label="Cap in rupees"
                    type="number"
                    size="small"
                    fullWidth
                    defaultValue={coupon?.maxDiscount ? coupon.maxDiscount / 100 : ''}
                    disabled={pending}
                    helperText="Empty: uncapped"
                    slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
                  />
                </Grid>
              </>
            ) : (
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  name="flatValue"
                  label="Rupees off"
                  type="number"
                  size="small"
                  fullWidth
                  required
                  defaultValue={coupon?.kind === 'flat' ? coupon.value / 100 : ''}
                  disabled={pending}
                  helperText="A fixed coupon takes no cap — the till would apply that as well"
                  slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="minSubtotal"
                label="Goods must reach ₹"
                type="number"
                size="small"
                fullWidth
                defaultValue={coupon ? coupon.minSubtotal / 100 : ''}
                disabled={pending}
                helperText="Before the coupon; empty means any basket"
                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                name="maxRedemptions"
                label="Total claims"
                type="number"
                size="small"
                fullWidth
                defaultValue={coupon?.maxRedemptions ?? ''}
                disabled={pending}
                helperText="Empty: no limit"
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                name="perUserLimit"
                label="Per member"
                type="number"
                size="small"
                fullWidth
                defaultValue={coupon?.perUserLimit ?? 1}
                disabled={pending}
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="startsAt"
                label="Opens"
                type="datetime-local"
                size="small"
                fullWidth
                defaultValue={startsAt}
                disabled={pending}
                helperText="Empty: open now"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="endsAt"
                label="Closes"
                type="datetime-local"
                size="small"
                fullWidth
                defaultValue={endsAt}
                disabled={pending}
                helperText="Empty: never"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
            </Grid>

            <Grid size={12}>
              <FormControlLabel
                control={<Switch name="active" defaultChecked={coupon?.active ?? true} disabled={pending} />}
                label={<Typography variant="body2">Live</Typography>}
              />
            </Grid>
          </Grid>

          <Box>
            <Button
              type="submit"
              variant="contained"
              loading={pending}
              startIcon={<Iconify icon="solar:diskette-bold-duotone" />}
            >
              {coupon ? 'Save the coupon' : 'Create it'}
            </Button>
          </Box>
        </Stack>
      </Collapse>
    </Stack>
  );
}

/** The two edits a campaign actually needs in a hurry, on the row itself. */
export function CouponQuickEdit({ coupon }: { coupon: Coupon }) {
  const [liveState, liveAction, livePending] = useActionState<CouponActionState, FormData>(setCouponActive, {});
  const [limitState, limitAction, limitPending] = useActionState<CouponActionState, FormData>(patchCoupon, {});

  const said = liveState.ok || limitState.ok;
  const wrong = liveState.error || limitState.error;

  return (
    <Stack spacing={1} sx={{ minWidth: 240 }}>
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

      <Stack component="form" action={limitAction} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <input type="hidden" name="code" value={coupon.code} />
        <input type="hidden" name="note" value="quick edit" />
        <TextField
          name="maxRedemptions"
          label="Claims"
          type="number"
          size="small"
          defaultValue={coupon.maxRedemptions ?? ''}
          disabled={limitPending}
          sx={{ width: 100 }}
          slotProps={{ htmlInput: { min: 1 } }}
        />
        <TextField
          name="perUserLimit"
          label="Each"
          type="number"
          size="small"
          defaultValue={coupon.perUserLimit}
          disabled={limitPending}
          sx={{ width: 80 }}
          slotProps={{ htmlInput: { min: 1 } }}
        />
        <Button type="submit" size="small" variant="outlined" loading={limitPending}>
          Set
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box component="form" action={liveAction}>
          <input type="hidden" name="code" value={coupon.code} />
          <input type="hidden" name="active" value={coupon.active ? 'false' : 'true'} />
          <Button type="submit" size="small" color={coupon.active ? 'error' : 'primary'} loading={livePending}>
            {coupon.active ? 'Switch off' : 'Switch on'}
          </Button>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {number(coupon.redemptions)} claimed · {rupees(coupon.given)} given
        </Typography>
      </Stack>
    </Stack>
  );
}

/**
 * Deleting one.
 *
 * Typing the code is the confirmation, and the panel says what it is for:
 * the API refuses a coupon anything ever used, so this only ever removes a
 * campaign that never ran. Ending one that did is the switch above.
 */
export function CouponDelete({ coupon }: { coupon: Coupon }) {
  const [state, action, pending] = useActionState<CouponActionState, FormData>(deleteCoupon, {});

  return (
    <Stack component="form" action={action} spacing={1.5}>
      <input type="hidden" name="code" value={coupon.code} />
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

      {coupon.deletable ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Nothing has ever used {coupon.code}, so it can be removed outright. Any basket still holding the code is
          cleared with it.
        </Typography>
      ) : (
        <Alert severity="info" variant="outlined">
          {number(coupon.orders)} order(s) hold {coupon.code} and {number(coupon.redemptions)} claim(s) are counted
          against it, so it cannot be deleted — switching it off stops it applying everywhere at once and leaves those
          orders readable.
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
        <TextField
          name="confirm"
          label={`Type ${coupon.code}`}
          size="small"
          disabled={pending || !coupon.deletable}
          sx={{ width: 200 }}
        />
        <TextField name="note" label="Note" size="small" disabled={pending || !coupon.deletable} sx={{ width: 200 }} />
        <Button
          type="submit"
          color="error"
          variant="outlined"
          loading={pending}
          disabled={!coupon.deletable}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
        >
          Delete it
        </Button>
      </Stack>
      {!coupon.deletable && (
        <Label color="default" variant="soft" sx={{ alignSelf: 'flex-start' }}>
          switch it off instead
        </Label>
      )}
    </Stack>
  );
}
