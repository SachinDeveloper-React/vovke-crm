'use client';

import { useState, useTransition } from 'react';

import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';

import { Iconify } from '@/src/components/iconify/iconify';
import { Can } from '@/src/components/staff/staff-context';

import { refreshWebsite } from './actions';

/** Asks the website to re-read every page now — after a deploy, or when in doubt. */
export function RefreshSiteButton() {
  const [busy, start] = useTransition();
  const [said, setSaid] = useState<string | null>(null);
  return (
    <Can permission="website.edit">
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        loading={busy}
        startIcon={<Iconify icon="solar:refresh-bold-duotone" />}
        onClick={() =>
          start(async () => {
            const result = await refreshWebsite();
            setSaid(result.message);
          })
        }
      >
        Refresh the website now
      </Button>
      <Snackbar open={said !== null} autoHideDuration={6000} onClose={() => setSaid(null)} message={said} />
    </Can>
  );
}
