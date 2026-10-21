import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Sparkline } from '@/src/components/charts';
import { Iconify } from '@/src/components/iconify/iconify';

/**
 * The stat tile: label in sentence case, the value in the same sans as
 * everything else, an optional signed delta against a *named* period, and an
 * optional sparkline.
 *
 * The delta's color says direction × whether up is good — a rise in refused
 * days is not a win — which is why `goodDirection` is a prop and not an
 * assumption.
 */
export function Stat({
  label,
  value,
  hint,
  delta,
  deltaDirection,
  goodDirection = 'up',
  trend,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: string;
  deltaDirection?: 'up' | 'down' | 'flat';
  goodDirection?: 'up' | 'down' | 'none';
  trend?: number[];
  icon?: string;
}) {
  const tone =
    !deltaDirection || deltaDirection === 'flat' || goodDirection === 'none'
      ? 'text.secondary'
      : deltaDirection === goodDirection
        ? 'success.main'
        : 'error.main';

  return (
    <Card sx={{ p: 2.5, height: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {icon && <Iconify icon={icon} width={18} sx={{ color: 'text.disabled' }} />}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
      </Stack>

      <Typography variant="h3" sx={{ lineHeight: 1.1 }}>
        {value}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 'auto', minHeight: 20 }}>
        {delta && (
          <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center', color: tone }}>
            <Iconify
              width={16}
              icon={
                deltaDirection === 'up'
                  ? 'eva:trending-up-fill'
                  : deltaDirection === 'down'
                    ? 'eva:trending-down-fill'
                    : 'eva:minus-fill'
              }
            />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {delta}
            </Typography>
          </Stack>
        )}
        {hint && (
          <Typography variant="caption" sx={{ color: 'text.disabled', minWidth: 0 }}>
            {hint}
          </Typography>
        )}
      </Stack>

      {trend && trend.length > 1 && (
        <Box sx={{ mt: 0.5 }}>
          <Sparkline values={trend} />
        </Box>
      )}
    </Card>
  );
}
