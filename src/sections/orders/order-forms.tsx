'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { rupees } from '@/src/lib/format';
import type { OrderStatus, PaidWith } from '@/src/lib/types';

import { advanceOrder, cancelOrder, refundOrder, setOrderAddress, type OrderActionState } from './actions';

/** Where an order may go from where it is — the same table the API enforces. */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['placed'],
  placed: ['confirmed', 'shipped'],
  confirmed: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

const CANCELLABLE: OrderStatus[] = ['pending_payment', 'placed', 'confirmed'];
const ADDRESS_FIXABLE: OrderStatus[] = ['pending_payment', 'placed', 'confirmed'];

export function AdvanceOrderForm({
  orderId,
  userId,
  status,
  trackingRef,
}: {
  orderId: string;
  userId: string;
  status: OrderStatus;
  trackingRef: string | null;
}) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(advanceOrder, {});
  const next = NEXT[status];

  return (
    <Stack component="form" action={action} spacing={2}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="userId" value={userId} />
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

      {next.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          An order that is {status.replace(/_/g, ' ')} is finished — there is nowhere forward from here. A delivered
          order is put right with a refund, not by being moved back.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField select name="status" label="Mark it as" size="small" fullWidth defaultValue={next[0]} disabled={pending}>
              {next.map(option => (
                <MenuItem key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 7 }}>
            <TextField
              name="trackingRef"
              label="Courier reference"
              size="small"
              fullWidth
              defaultValue={trackingRef ?? ''}
              disabled={pending}
              helperText="Shown to the member when it ships"
            />
          </Grid>
          <Grid size={12}>
            <TextField name="note" label="Note (kept on the audit row)" size="small" fullWidth disabled={pending} />
          </Grid>
        </Grid>
      )}

      {next.length > 0 && (
        <Box>
          <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:arrow-right-bold-duotone" />}>
            Move it along
          </Button>
        </Box>
      )}
    </Stack>
  );
}

/** Cancel and refund, each armed by a second click. */
export function UndoOrderForms({
  orderId,
  userId,
  status,
  paidWith,
  payable,
  coinsUsed,
}: {
  orderId: string;
  userId: string;
  status: OrderStatus;
  paidWith: PaidWith;
  payable: number;
  coinsUsed: number;
}) {
  const [cancelState, cancelAction, cancelPending] = useActionState<OrderActionState, FormData>(cancelOrder, {});
  const [refundState, refundAction, refundPending] = useActionState<OrderActionState, FormData>(refundOrder, {});
  const [arming, setArming] = useState<'cancel' | 'refund' | null>(null);

  const cancellable = CANCELLABLE.includes(status);
  const refundable = status !== 'cancelled' && status !== 'refunded' && (payable > 0 || coinsUsed > 0);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Cancel
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
          For an order that has not happened yet: the coins, the stock and the coupon all go back, and the payment is
          refunded through the gateway.
        </Typography>
        {cancelState.ok && (
          <Alert severity="success" variant="outlined" sx={{ mb: 1 }}>
            {cancelState.ok}
          </Alert>
        )}
        {cancelState.error && (
          <Alert severity="error" variant="outlined" sx={{ mb: 1 }}>
            {cancelState.error}
          </Alert>
        )}
        {cancellable ? (
          <Stack component="form" action={cancelAction} spacing={1.5}>
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="userId" value={userId} />
            <TextField name="reason" label="Why" size="small" fullWidth required disabled={cancelPending} />
            {arming === 'cancel' ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'error.main' }}>
                  {paidWith === 'coins'
                    ? `${coinsUsed} coins go back and the stock returns to the shelf.`
                    : `${rupees(payable)} is refunded${coinsUsed > 0 ? ` and ${coinsUsed} coins go back` : ''}.`}
                </Typography>
                <Button type="submit" size="small" color="error" variant="contained" loading={cancelPending}>
                  Yes, cancel it
                </Button>
                <Button size="small" color="inherit" onClick={() => setArming(null)} disabled={cancelPending}>
                  Keep it
                </Button>
              </Stack>
            ) : (
              <Box>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  disabled={cancelPending}
                  onClick={() => setArming('cancel')}
                  startIcon={<Iconify icon="solar:close-circle-bold-duotone" />}
                >
                  Cancel this order
                </Button>
              </Box>
            )}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            An order that is {status.replace(/_/g, ' ')} can no longer be cancelled.
          </Typography>
        )}
      </Box>

      <Box sx={{ borderTop: '1px dashed', borderColor: 'divider', pt: 2.5 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Refund
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
          For an order that has happened: the money and the coins go back, and the stock does not — it is in somebody’s
          house.
        </Typography>
        {refundState.ok && (
          <Alert severity="success" variant="outlined" sx={{ mb: 1 }}>
            {refundState.ok}
          </Alert>
        )}
        {refundState.error && (
          <Alert severity="error" variant="outlined" sx={{ mb: 1 }}>
            {refundState.error}
          </Alert>
        )}
        {refundable ? (
          <Stack component="form" action={refundAction} spacing={1.5}>
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="userId" value={userId} />
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField name="reason" label="Why" size="small" fullWidth required disabled={refundPending} />
              </Grid>
              {payable > 0 && (
                <Grid size={{ xs: 12, sm: 5 }}>
                  <TextField
                    name="amount"
                    label="Refund in rupees"
                    type="number"
                    size="small"
                    fullWidth
                    disabled={refundPending}
                    placeholder={String(payable / 100)}
                    helperText={`Blank refunds all of ${rupees(payable)}`}
                    slotProps={{ htmlInput: { min: 0.01, max: payable / 100, step: 0.01 } }}
                  />
                </Grid>
              )}
            </Grid>
            {arming === 'refund' ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'error.main' }}>
                  This cannot be undone from here.
                </Typography>
                <Button type="submit" size="small" color="error" variant="contained" loading={refundPending}>
                  Yes, refund it
                </Button>
                <Button size="small" color="inherit" onClick={() => setArming(null)} disabled={refundPending}>
                  Cancel
                </Button>
              </Stack>
            ) : (
              <Box>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  disabled={refundPending}
                  onClick={() => setArming('refund')}
                  startIcon={<Iconify icon="solar:undo-left-round-bold-duotone" />}
                >
                  Refund this order
                </Button>
              </Box>
            )}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {status === 'refunded'
              ? 'Already refunded.'
              : status === 'cancelled'
                ? 'Cancelled, which already put everything back.'
                : 'Nothing was ever taken for this order.'}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

/** The typo case: the order's own address snapshot, corrected. */
export function OrderAddressForm({
  orderId,
  userId,
  status,
  address,
}: {
  orderId: string;
  userId: string;
  status: OrderStatus;
  address: Record<string, string | undefined> | null;
}) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(setOrderAddress, {});

  if (!ADDRESS_FIXABLE.includes(status)) {
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
        An order that is {status.replace(/_/g, ' ')} has already gone — the label is printed, and changing the record
        would make it lie.
      </Typography>
    );
  }

  return (
    <Stack component="form" action={action} spacing={2}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="userId" value={userId} />
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

      <Grid container spacing={2}>
        {(
          [
            ['name', 'Name', 6],
            ['phone', 'Phone', 6],
            ['line1', 'Address line 1', 12],
            ['line2', 'Address line 2', 12],
            ['city', 'City', 4],
            ['state', 'State', 4],
            ['postalCode', 'PIN', 4],
          ] as const
        ).map(([field, label, span]) => (
          <Grid key={field} size={{ xs: 12, sm: span }}>
            <TextField
              name={field}
              label={label}
              size="small"
              fullWidth
              defaultValue={address?.[field] ?? ''}
              disabled={pending}
            />
          </Grid>
        ))}
        <Grid size={12}>
          <TextField name="reason" label="Why (required)" size="small" fullWidth required disabled={pending} />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:map-point-bold-duotone" />}>
          Save the address
        </Button>
      </Box>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        This patches the order’s own snapshot, not the member’s address book — fixing the book would change where their
        next order goes and leave this one on its way to the wrong flat. The member is told.
      </Typography>
    </Stack>
  );
}
