'use client';

import { useActionState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { Iconify } from '@/src/components/iconify/iconify';
import { coins } from '@/src/lib/format';
import type { Badge } from '@/src/lib/types';

import { grantBadge, type MoneyActionState } from './money-actions';

/**
 * Giving a badge by hand.
 *
 * Only the locked ones are offered: a badge is never taken back, so granting
 * one somebody already holds has nothing to do and the list would only invite
 * the attempt. What it is worth is on the option, because badge coins wait on
 * their own switch and an operator should know which they are promising.
 */
export function GrantBadgeForm({ userId, locked, rewardsEnabled }: { userId: string; locked: Badge[]; rewardsEnabled: boolean }) {
  const [state, action, pending] = useActionState<MoneyActionState, FormData>(grantBadge, {});

  if (locked.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
        They hold every badge on the shelf. There is nothing left to give.
      </Typography>
    );
  }

  return (
    <Stack component="form" action={action} spacing={2}>
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
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField select name="achievementId" label="Badge" size="small" fullWidth defaultValue={locked[0].id} disabled={pending}>
            {locked.map(badge => (
              <MenuItem key={badge.id} value={badge.id}>
                {badge.title}
                {badge.rewardCoins > 0 ? ` · ${coins(badge.rewardCoins)} coins` : ''}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="reason" label="Why (required)" size="small" fullWidth required disabled={pending} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Button type="submit" variant="contained" loading={pending} startIcon={<Iconify icon="solar:medal-ribbon-star-bold-duotone" />}>
            Give the badge
          </Button>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {rewardsEnabled
            ? 'Its coins are paid, under the daily ceiling, and the member is told.'
            : 'Badge coins are switched off, so nothing is minted — the badge is unlocked and the member is told plainly.'}
        </Typography>
      </Stack>
    </Stack>
  );
}
