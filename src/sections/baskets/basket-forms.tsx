'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';

import {
  clearBasket,
  clearBasketCoupon,
  removeBasketLine,
  removeWishlistEntry,
  type BasketActionState,
} from './actions';

function Said({ state }: { state: BasketActionState }) {
  if (!state.ok && !state.error) return null;
  return (
    <Alert severity={state.error ? 'error' : 'success'} variant="outlined" sx={{ py: 0 }}>
      <Typography variant="caption">{state.error ?? state.ok}</Typography>
    </Alert>
  );
}

/**
 * Taking one line out.
 *
 * The reason box is the form rather than a confirmation step: what stops a
 * mis-click is having to type something, and what is typed is kept — this is
 * somebody else's basket changing under them, and the audit row is the only
 * place that says why.
 */
export function RemoveLine({
  userId,
  itemId,
  size,
  color,
}: {
  userId: string;
  itemId: string;
  size: string | null;
  color: string | null;
}) {
  const [state, action, pending] = useActionState<BasketActionState, FormData>(removeBasketLine, {});

  return (
    <Stack component="form" action={action} spacing={0.75} sx={{ minWidth: 220 }}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="size" value={size ?? ''} />
      <input type="hidden" name="color" value={color ?? ''} />
      <Said state={state} />
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <TextField name="reason" label="Why" size="small" disabled={pending} sx={{ flex: 1 }} placeholder="out of stock" />
        <Button type="submit" size="small" color="error" variant="outlined" loading={pending}>
          Remove
        </Button>
      </Stack>
    </Stack>
  );
}

/** The coupon, off. */
export function RemoveCoupon({ userId, code }: { userId: string; code: string }) {
  const [state, action, pending] = useActionState<BasketActionState, FormData>(clearBasketCoupon, {});

  return (
    <Stack component="form" action={action} spacing={0.75}>
      <input type="hidden" name="userId" value={userId} />
      <Said state={state} />
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
        <TextField
          name="reason"
          label="Why"
          size="small"
          disabled={pending}
          sx={{ width: 220 }}
          placeholder="campaign ended"
        />
        <Button
          type="submit"
          size="small"
          color="warning"
          variant="outlined"
          loading={pending}
          startIcon={<Iconify icon="solar:ticket-sale-bold-duotone" />}
        >
          Take {code} off
        </Button>
      </Stack>
    </Stack>
  );
}

/** The lot. */
export function ClearBasket({ userId, lines }: { userId: string; lines: number }) {
  const [state, action, pending] = useActionState<BasketActionState, FormData>(clearBasket, {});

  return (
    <Stack component="form" action={action} spacing={0.75}>
      <input type="hidden" name="userId" value={userId} />
      <Said state={state} />
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
        <TextField
          name="reason"
          label="Why"
          size="small"
          disabled={pending}
          sx={{ width: 220 }}
          placeholder="member asked on the phone"
        />
        <Button
          type="submit"
          size="small"
          color="error"
          variant="outlined"
          loading={pending}
          disabled={lines === 0}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
        >
          Empty it
        </Button>
      </Stack>
    </Stack>
  );
}

/** Unsaving something for somebody. */
export function RemoveSaved({ userId, itemId }: { userId: string; itemId: string }) {
  const [state, action, pending] = useActionState<BasketActionState, FormData>(removeWishlistEntry, {});

  return (
    <Stack component="form" action={action} spacing={0.75} sx={{ minWidth: 220 }}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="itemId" value={itemId} />
      <Said state={state} />
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <TextField name="reason" label="Why" size="small" disabled={pending} sx={{ flex: 1 }} placeholder="duplicate" />
        <Button type="submit" size="small" color="inherit" variant="outlined" loading={pending}>
          Unsave
        </Button>
      </Stack>
    </Stack>
  );
}
