'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';

import { deleteReview, type ReviewActionState } from './actions';

/**
 * Taking one review down, from wherever it is being read.
 *
 * The reason box is the form rather than a confirmation dialog: the thing
 * that stops a mis-click is having to say something, and what is typed is
 * kept — a dialog would ask for a click and record nothing.
 */
export function ReviewDelete({ id, compact = false }: { id: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<ReviewActionState, FormData>(deleteReview, {});

  return (
    <Stack component="form" action={action} spacing={0.75} sx={{ minWidth: compact ? 200 : 260 }}>
      <input type="hidden" name="id" value={id} />
      {state.ok && (
        <Alert severity="success" variant="outlined" sx={{ py: 0 }}>
          <Typography variant="caption">{state.ok}</Typography>
        </Alert>
      )}
      {state.error && (
        <Alert severity="error" variant="outlined" sx={{ py: 0 }}>
          <Typography variant="caption">{state.error}</Typography>
        </Alert>
      )}
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <TextField
          name="reason"
          label="Why"
          size="small"
          disabled={pending}
          sx={{ flex: 1 }}
          placeholder="abuse, spam, wrong product"
        />
        <Button
          type="submit"
          size="small"
          color="error"
          variant="outlined"
          loading={pending}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold-duotone" />}
        >
          Remove
        </Button>
      </Stack>
    </Stack>
  );
}
