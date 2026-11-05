'use client';

import { useActionState, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import type { MediaAsset } from '@/src/lib/types';

import { removeMedia, type MediaState } from './actions';

/**
 * One image, with the two things anybody came here to do.
 *
 * The filename is the loud part rather than the picture's dimensions or its
 * key, because the filename is what goes in a spreadsheet — it is the only
 * string on this card that an operator will ever type somewhere else.
 *
 * Deleting is armed rather than immediate, and the API refuses it outright
 * while a product still shows the image. A shelf drawing a broken picture
 * is worse than a shelf with none, and whoever deleted it would never find
 * out which item they had spoiled.
 */
export function MediaCard({ asset }: { asset: MediaAsset }) {
  const [state, action, pending] = useActionState<MediaState, FormData>(removeMedia, {});
  const [arming, setArming] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // A browser that refuses the clipboard is not a failure worth a dialog:
      // the URL is on the card and can be selected by hand.
    }
  };

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box
        component="img"
        src={asset.url}
        alt={asset.filename}
        loading="lazy"
        sx={{ width: 1, aspectRatio: '1 / 1', objectFit: 'cover', display: 'block', bgcolor: 'background.neutral' }}
      />

      <Stack spacing={0.5} sx={{ p: 1.25 }}>
        <Tooltip title={asset.filename}>
          <Typography variant="subtitle2" noWrap>
            {asset.filename}
          </Typography>
        </Tooltip>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {asset.kind} · {Math.max(1, Math.round(asset.bytes / 1024))} KB
        </Typography>

        {state.error && (
          <Typography variant="caption" sx={{ color: 'error.main' }}>
            {state.error}
          </Typography>
        )}

        <Stack direction="row" spacing={0.5}>
          <Button size="small" onClick={copy} sx={{ flex: 1 }}>
            {copied ? 'Copied' : 'Copy URL'}
          </Button>

          {arming ? (
            <Stack component="form" action={action} direction="row" spacing={0.5}>
              <input type="hidden" name="id" value={asset.id} />
              <Button size="small" type="submit" color="error" disabled={pending}>
                {pending ? '…' : 'Sure?'}
              </Button>
              <Button size="small" onClick={() => setArming(false)} disabled={pending}>
                No
              </Button>
            </Stack>
          ) : (
            <Button size="small" color="error" onClick={() => setArming(true)}>
              <Iconify icon="solar:trash-bin-trash-bold-duotone" width={16} />
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}
