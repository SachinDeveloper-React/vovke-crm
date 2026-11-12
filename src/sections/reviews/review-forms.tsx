'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { DialogIconButton } from '@/src/components/ui/dialog-button';

import { deleteReview, editReview, type ReviewActionState } from './actions';

type EditableReview = { id: string; rating: number; title: string | null; body: string; verified: boolean };

/** The words, the stars and the verified mark, corrected in place. */
function ReviewEditForm({ review }: { review: EditableReview }) {
  const [state, action, pending] = useActionState<ReviewActionState, FormData>(editReview, {});

  return (
    <Stack component="form" action={action} spacing={2} sx={{ pt: 1 }}>
      <input type="hidden" name="id" value={review.id} />
      <input type="hidden" name="verified" value="off" />
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
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select name="rating" label="Stars" size="small" fullWidth defaultValue={String(review.rating)} disabled={pending}>
            {[5, 4, 3, 2, 1].map(stars => (
              <MenuItem key={stars} value={String(stars)}>
                {'★'.repeat(stars)} ({stars})
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            name="title"
            label="Title"
            size="small"
            fullWidth
            defaultValue={review.title ?? ''}
            disabled={pending}
            slotProps={{ htmlInput: { maxLength: 80 } }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            name="body"
            label="What they wrote"
            size="small"
            fullWidth
            multiline
            minRows={3}
            required
            defaultValue={review.body}
            disabled={pending}
            slotProps={{ htmlInput: { maxLength: 1000 } }}
          />
        </Grid>
        <Grid size={12}>
          <FormControlLabel
            control={<Switch name="verified" defaultChecked={review.verified} disabled={pending} />}
            label={<Typography variant="body2">Verified buyer</Typography>}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            name="reason"
            label="Why (required, kept on the audit row)"
            size="small"
            fullWidth
            required
            disabled={pending}
            placeholder="phone number in the text, member asked to change the stars"
            slotProps={{ htmlInput: { maxLength: 300 } }}
          />
        </Grid>
      </Grid>

      <Box>
        <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
          Save the review
        </Button>
      </Box>
    </Stack>
  );
}

/** The pencil on a review row. */
export function ReviewEdit({ review }: { review: EditableReview }) {
  return (
    <DialogIconButton
      icon="solar:pen-bold-duotone"
      tooltip="Edit this review"
      maxWidth="sm"
      title="Edit the review"
      subtitle="Changes what the member wrote, as every shopper reads it. Moving the stars recounts the item at once."
    >
      <ReviewEditForm review={review} />
    </DialogIconButton>
  );
}

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
