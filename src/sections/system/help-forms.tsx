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
import type { FaqRow, GuideSection } from '@/src/lib/types';

import {
  deleteFaq,
  deleteGuideSection,
  patchFaq,
  saveFaq,
  saveGuideSection,
  type HelpActionState,
} from './faq-actions';

function Said({ state, small = false }: { state: HelpActionState; small?: boolean }) {
  if (!state.ok && !state.error) return null;
  return (
    <Alert severity={state.error ? 'error' : 'success'} variant="outlined" sx={small ? { py: 0 } : undefined}>
      {small ? <Typography variant="caption">{state.error ?? state.ok}</Typography> : (state.error ?? state.ok)}
    </Alert>
  );
}

/**
 * Writing a help article.
 *
 * This form is the reason the FAQs are a collection rather than a constant
 * in the app: a wave of the same question is answered by writing one row,
 * and members read it without waiting for a release. The tags are what
 * *they* call the thing — the search matches those as well as the question.
 */
export function FaqForm({ categories, article }: { categories: string[]; article?: FaqRow }) {
  const [state, action, pending] = useActionState<HelpActionState, FormData>(saveFaq, {});
  const [open, setOpen] = useState(!article);

  return (
    <Stack spacing={2}>
      {article && (
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
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                name="id"
                label="Id"
                size="small"
                fullWidth
                required
                defaultValue={article?.id ?? ''}
                disabled={pending || Boolean(article)}
                helperText={article ? 'Fixed' : 'how-coins-expire'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                name="category"
                label="Shelf"
                size="small"
                fullWidth
                defaultValue={article?.category ?? categories[0]}
                disabled={pending}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
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
                defaultValue={article?.sort ?? 0}
                disabled={pending}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                name="question"
                label="The question"
                size="small"
                fullWidth
                required
                defaultValue={article?.question ?? ''}
                disabled={pending}
                helperText="In the words a member would use"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                name="answer"
                label="The answer"
                size="small"
                fullWidth
                required
                multiline
                minRows={4}
                defaultValue={article?.answer ?? ''}
                disabled={pending}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                name="tags"
                label="Also searchable by"
                size="small"
                fullWidth
                defaultValue={(article?.tags ?? []).join(', ')}
                disabled={pending}
                helperText="Comma-separated — what they call it, not what we do"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={<Switch name="active" defaultChecked={article?.active ?? true} disabled={pending} />}
                label={<Typography variant="body2">Showing in the help centre</Typography>}
              />
            </Grid>
          </Grid>

          <Box>
            <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
              {article ? 'Save the article' : 'Write it'}
            </Button>
          </Box>
        </Stack>
      </Collapse>
    </Stack>
  );
}

/** Show it, hide it, move it, or take it down — on the row itself. */
export function FaqQuickEdit({ article, categories }: { article: FaqRow; categories: string[] }) {
  const [patchState, patchAction, patchPending] = useActionState<HelpActionState, FormData>(patchFaq, {});
  const [deleteState, deleteAction, deletePending] = useActionState<HelpActionState, FormData>(deleteFaq, {});

  return (
    <Stack spacing={1} sx={{ minWidth: 240 }}>
      <Said state={patchState} small />
      <Said state={deleteState} small />

      <Stack component="form" action={patchAction} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <input type="hidden" name="id" value={article.id} />
        <input type="hidden" name="active" value="off" />
        <input type="hidden" name="note" value="quick edit" />
        <TextField
          select
          name="category"
          label="Shelf"
          size="small"
          defaultValue={article.category}
          disabled={patchPending}
          sx={{ width: 120 }}
        >
          {categories.map(category => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          name="sort"
          label="#"
          type="number"
          size="small"
          defaultValue={article.sort}
          disabled={patchPending}
          sx={{ width: 70 }}
        />
        <FormControlLabel
          control={<Switch name="active" size="small" defaultChecked={article.active} disabled={patchPending} />}
          label={<Typography variant="caption">Show</Typography>}
          sx={{ mr: 0 }}
        />
        <Button type="submit" size="small" variant="outlined" loading={patchPending}>
          Set
        </Button>
      </Stack>

      <Stack component="form" action={deleteAction} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <input type="hidden" name="id" value={article.id} />
        <TextField name="confirm" label={`Type ${article.id}`} size="small" disabled={deletePending} sx={{ flex: 1 }} />
        <Button type="submit" size="small" color="error" variant="outlined" loading={deletePending}>
          Delete
        </Button>
      </Stack>
    </Stack>
  );
}

/**
 * A chapter of the app guide.
 *
 * The steps are one per line, `title | what to do`, for the same reason the
 * product page's facts are: a repeating field editor is several hundred
 * lines of client state to type what a textarea types in one. The icon and
 * the tint are dropdowns rather than text because the app parses the whole
 * guide — a name it cannot draw makes the guide fail to load, not a blank
 * tile.
 */
export function GuideForm({
  icons,
  tints,
  section,
}: {
  icons: string[];
  tints: string[];
  section?: GuideSection;
}) {
  const [state, action, pending] = useActionState<HelpActionState, FormData>(saveGuideSection, {});
  const [open, setOpen] = useState(!section);

  return (
    <Stack spacing={2}>
      {section && (
        <Button
          size="small"
          color="inherit"
          onClick={() => setOpen(value => !value)}
          startIcon={<Iconify icon={open ? 'eva:chevron-up-fill' : 'eva:edit-2-outline'} />}
          sx={{ alignSelf: 'flex-start' }}
        >
          {open ? 'Close' : 'Edit the chapter'}
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
                defaultValue={section?.id ?? ''}
                disabled={pending || Boolean(section)}
                helperText={section ? 'Fixed' : 'first-steps'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField name="title" label="Title" size="small" fullWidth required defaultValue={section?.title ?? ''} disabled={pending} />
            </Grid>
            <Grid size={12}>
              <TextField
                name="summary"
                label="Summary"
                size="small"
                fullWidth
                defaultValue={section?.summary ?? ''}
                disabled={pending}
                helperText="The line under the title"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select name="icon" label="Icon" size="small" fullWidth defaultValue={section?.icon ?? icons[0]} disabled={pending}>
                {icons.map(icon => (
                  <MenuItem key={icon} value={icon}>
                    {icon}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField select name="tint" label="Tint" size="small" fullWidth defaultValue={section?.tint ?? tints[0]} disabled={pending}>
                {tints.map(tint => (
                  <MenuItem key={tint} value={tint}>
                    {tint}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField name="sort" label="Order" type="number" size="small" fullWidth defaultValue={section?.sort ?? 0} disabled={pending} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField name="note" label="Note" size="small" fullWidth disabled={pending} helperText="Audit row" />
            </Grid>
            <Grid size={12}>
              <TextField
                name="steps"
                label="Steps"
                size="small"
                fullWidth
                required
                multiline
                minRows={4}
                defaultValue={(section?.steps ?? []).map(step => `${step.title} | ${step.body}`).join('\n')}
                disabled={pending}
                helperText="One per line: Allow activity access | VOKVE counts with the phone’s own step sensor"
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={<Switch name="active" defaultChecked={section?.active ?? true} disabled={pending} />}
                label={<Typography variant="body2">In the guide</Typography>}
              />
            </Grid>
          </Grid>

          <Box>
            <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:diskette-bold-duotone" />}>
              {section ? 'Save the chapter' : 'Add it'}
            </Button>
          </Box>
        </Stack>
      </Collapse>
    </Stack>
  );
}

export function GuideDelete({ id }: { id: string }) {
  const [state, action, pending] = useActionState<HelpActionState, FormData>(deleteGuideSection, {});

  return (
    <Stack component="form" action={action} spacing={0.75} sx={{ minWidth: 220 }}>
      <input type="hidden" name="id" value={id} />
      <Said state={state} small />
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <TextField name="confirm" label={`Type ${id}`} size="small" disabled={pending} sx={{ flex: 1 }} />
        <Button type="submit" size="small" color="error" variant="outlined" loading={pending}>
          Delete
        </Button>
      </Stack>
    </Stack>
  );
}
