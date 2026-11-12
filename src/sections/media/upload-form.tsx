'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';

import { confirmUpload, signUpload } from './actions';

/** What the bucket accepts, and what the picker therefore offers. */
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export const KINDS = [
  { value: 'shop', label: 'Shop product' },
  { value: 'food', label: 'Food' },
  { value: 'plan', label: 'Diet plan' },
];

interface Done {
  filename: string;
  url?: string;
  error?: string;
}

/**
 * Puts files in the bucket, one signed URL at a time.
 *
 * Three steps per file and the middle one does not come through here: the
 * API signs a key, the browser puts the bytes straight to S3, and the API
 * is then told to go and look. That shape is not an optimisation — the API
 * runs where a request body over four and a half megabytes is refused, and
 * a four megabyte photo base64'd into one is past that before any code
 * runs. It also means a failed upload leaves nothing behind but an object
 * nobody has a row for.
 *
 * Files are done one after another rather than all at once. A folder of two
 * hundred product photos fired in parallel is two hundred open sockets and
 * a browser that stops painting; in series it is slower to finish and the
 * operator can watch it happen, which is what they actually want.
 */
export function MediaUploadForm({ onUploaded }: { onUploaded?: (url: string) => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState('shop');
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Done[]>([]);

  const upload = useCallback(
    async (file: File): Promise<Done> => {
      if (!TYPES.includes(file.type)) {
        return { filename: file.name, error: 'Not a JPEG, PNG or WebP.' };
      }
      if (file.size > MAX_BYTES) {
        return {
          filename: file.name,
          error: `${Math.round(file.size / 1024 / 1024)} MB — the most is ${MAX_BYTES / 1024 / 1024} MB.`,
        };
      }

      const signed = await signUpload(kind, file.type, file.name);
      if (!signed.upload) return { filename: file.name, error: signed.error ?? 'Could not start.' };

      const put = await fetch(signed.upload.uploadUrl, {
        method: 'PUT',
        // Exactly what was signed. Anything else and S3 refuses it, which is
        // the one refusal that cannot be talked out of.
        headers: { 'content-type': signed.upload.contentType },
        body: file,
      }).catch(() => null);

      if (!put?.ok) {
        return {
          filename: file.name,
          error: put
            ? `The bucket refused it (${put.status}).`
            : 'The bucket could not be reached — check its CORS rules allow PUT from this panel.',
        };
      }

      const saved = await confirmUpload(signed.upload.key, kind, file.name);
      return saved.asset
        ? { filename: file.name, url: saved.asset.url }
        : { filename: file.name, error: saved.error ?? 'Uploaded, but not recorded.' };
    },
    [kind],
  );

  const choose = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setDone([]);
      const results: Done[] = [];
      for (const file of Array.from(files)) {
        setBusy(file.name);
        // Sequential on purpose — see the note above.
        // eslint-disable-next-line no-await-in-loop
        const result = await upload(file);
        results.push(result);
        setDone([...results]);
        if (result.url) onUploaded?.(result.url);
      }
      setBusy(null);
      if (input.current) input.current.value = '';
      router.refresh();
    },
    [upload, onUploaded, router],
  );

  const failed = done.filter(row => row.error);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
        <TextField
          select
          label="These are for"
          size="small"
          value={kind}
          onChange={event => setKind(event.target.value)}
          disabled={Boolean(busy)}
          sx={{ minWidth: 200 }}
          helperText="Only narrows the picker later"
        >
          {KINDS.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <Button
          variant="contained"
          component="label"
          disabled={Boolean(busy)}
          startIcon={<Iconify icon="solar:upload-bold-duotone" width={18} />}
        >
          Choose images
          <input
            ref={input}
            hidden
            multiple
            type="file"
            accept={TYPES.join(',')}
            onChange={event => choose(event.target.files)}
          />
        </Button>
      </Stack>

      {busy && (
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Uploading {busy}…
          </Typography>
          <LinearProgress />
        </Stack>
      )}

      {done.length > 0 && !busy && (
        <Alert severity={failed.length > 0 ? 'warning' : 'success'} variant="outlined">
          {done.length - failed.length} of {done.length} uploaded.
          {failed.map(row => (
            <Typography key={row.filename} variant="caption" sx={{ display: 'block' }}>
              {row.filename}: {row.error}
            </Typography>
          ))}
        </Alert>
      )}
    </Stack>
  );
}
