'use client';

import { useEffect } from 'react';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { LinkButton } from '@/src/components/ui/nav';
import { paths } from '@/src/layout/paths';

/**
 * A read that failed for a reason the page cannot do anything about.
 *
 * Not for a 404 — that renders `not-found.tsx` — and not for a 401, which
 * sends the operator to sign in. This is the rest: the API not answering at
 * all, a 500, a timeout. An operator needs to know the difference between
 * "no problems" and "could not ask", so it says which and offers the one
 * thing that sometimes works, which is asking again.
 *
 * Only `message` and `digest` cross the server→client boundary in
 * production, so the sentence is all there is to show — which is why the API
 * client puts the real reason *in* the message rather than only in a field.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The server has already logged it; this is for the browser console, so
    // a screenshot of the page and the console say the same thing.
    console.error('dashboard read failed', error);
  }, [error]);

  return (
    <Stack spacing={2} sx={{ p: 3, maxWidth: 720 }}>
      <Alert severity="error" variant="outlined">
        <AlertTitle sx={{ mb: 0.5 }}>That could not be read</AlertTitle>
        <Typography variant="body2">{error.message || 'The API did not answer.'}</Typography>
      </Alert>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Nothing was written: every page in the panel reads before it shows anything, so a failed read leaves the data
        exactly as it was. If the message mentions the API not answering, check that <code>vokve-backend</code> is
        running at the address this panel is pointed at.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button variant="contained" size="small" onClick={reset} startIcon={<Iconify icon="solar:refresh-bold-duotone" />}>
          Ask again
        </Button>
        <LinkButton href={paths.dashboard.diagnose} variant="outlined" size="small" color="inherit">
          Diagnose
        </LinkButton>
        <LinkButton href={paths.dashboard.root} variant="outlined" size="small" color="inherit">
          Analytics
        </LinkButton>
      </Stack>
      {error.digest && (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Reference {error.digest} — the server log carries the same id.
        </Typography>
      )}
    </Stack>
  );
}
