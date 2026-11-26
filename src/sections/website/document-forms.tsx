'use client';

import { useActionState, useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { DialogButton } from '@/src/components/ui/dialog-button';
import { Can } from '@/src/components/staff/staff-context';

import { createDocument, deleteDocument, type FormState } from './actions';

/** "Cookie Policy" → "cookie-policy": the address a title suggests. */
const slugOf = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/** A new document: a title, an address, and optionally another document's text to start from. */
export function CreateDocumentForm({ documents, siteUrl }: { documents: Array<{ slug: string; title: string }>; siteUrl: string }) {
  const [state, act, busy] = useActionState<FormState, FormData>(createDocument, {});
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [touched, setTouched] = useState(false);
  const address = touched ? slug : slugOf(title);

  return (
    <Can permission="website.edit" fallback={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Creating a document needs the “edit website pages” permission.</Typography>}>
      <Stack component="form" action={act} spacing={2}>
        {state.error && <Alert severity="error">{state.error}</Alert>}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              name="title"
              label="Title"
              placeholder="Cookie Policy"
              required
              fullWidth
              size="small"
              value={title}
              onChange={event => setTitle(event.target.value)}
              disabled={busy}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              name="slug"
              label="Address"
              required
              fullWidth
              size="small"
              value={address}
              onChange={event => {
                setTouched(true);
                setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
              }}
              disabled={busy}
              helperText={`${siteUrl.replace(/\/+$/, '')}/${address || '…'}`}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField name="copyFrom" label="Start from" select fullWidth size="small" defaultValue="" disabled={busy} helperText="A blank page, or a copy of another document’s text">
              <MenuItem value="">A blank page</MenuItem>
              {documents.map(doc => (
                <MenuItem key={doc.slug} value={doc.slug}>
                  A copy of {doc.title}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Button type="submit" variant="contained" loading={busy} startIcon={<Iconify icon="solar:document-add-bold-duotone" />}>
            Create, hidden
          </Button>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            It opens in the editor, hidden from the website until you switch “Published” on and save.
          </Typography>
        </Stack>
      </Stack>
    </Can>
  );
}

/** Deleting a document written here. Shipped ones are hidden instead, so this is never shown for them. */
export function DeleteDocumentButton({ slug, title }: { slug: string; title: string }) {
  const [state, act, busy] = useActionState<FormState, FormData>(deleteDocument, {});
  return (
    <Can permission="website.delete">
      <DialogButton
        label="Delete"
        icon="solar:trash-bin-trash-bold-duotone"
        color="error"
        title={`Delete ${title}?`}
        subtitle={`/${slug} answers “not found” from the moment it is deleted. Its last words stay in History.`}
      >
        <Stack component="form" action={act} spacing={2} sx={{ pt: 1 }}>
          {state.error && <Alert severity="error">{state.error}</Alert>}
          <input type="hidden" name="slug" value={slug} />
          <TextField name="confirm" label={`Type ${slug} to confirm`} required size="small" autoComplete="off" disabled={busy} />
          <Button type="submit" color="error" variant="contained" loading={busy}>
            Delete for good
          </Button>
        </Stack>
      </DialogButton>
    </Can>
  );
}
