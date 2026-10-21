import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { formatBy } from '@/src/lib/format';

import type { ValueFormat } from './tokens';

export type RankedItem = {
  label: string;
  value: number;
  /** The second figure, where the first one needs it: "of 48 installs". */
  hint?: string;
  /**
   * Status, not series: `critical` and `warning` are the reserved status
   * steps, and every row carries its label, so the color never has to be
   * read on its own.
   */
  tone?: 'accent' | 'alt' | 'warning' | 'critical';
};

const TONES: Record<NonNullable<RankedItem['tone']>, string> = {
  accent: 'var(--mui-palette-primary-main)',
  alt: 'var(--mui-palette-secondary-main)',
  warning: 'var(--mui-palette-warning-main)',
  critical: 'var(--mui-palette-error-main)',
};

/**
 * Identity by magnitude — "which screens, which OEMs, which faults".
 *
 * A ranked list rather than a pie: a reader compares bar lengths against a
 * shared baseline far better than they compare angles, and the label sits
 * beside its own bar rather than in a legend to be matched by color.
 */
export function RankedBars({
  items,
  valueFormat = 'number',
  max,
  emptyText = 'Nothing here yet.',
}: {
  items: RankedItem[];
  valueFormat?: ValueFormat;
  max?: number;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled', py: 2 }}>
        {emptyText}
      </Typography>
    );
  }

  const ceiling = Math.max(1, max ?? Math.max(...items.map(item => item.value)));

  return (
    <Stack spacing={1.5} sx={{ width: '100%' }}>
      {items.map(item => (
        <Box key={item.label}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 0.5 }}>
            <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.label}
            </Typography>
            {item.hint && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {item.hint}
              </Typography>
            )}
            <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatBy(valueFormat, item.value)}
            </Typography>
          </Stack>
          {/* The track is the same hue a step toward the surface, so the
              unfilled part still reads as part of the same measure. */}
          <Box sx={{ height: 8, borderRadius: 1, bgcolor: 'var(--mui-palette-action-hover)', overflow: 'hidden' }}>
            <Box
              sx={{
                height: 1,
                width: `${Math.max(1.5, (item.value / ceiling) * 100)}%`,
                borderRadius: 1,
                bgcolor: TONES[item.tone ?? 'accent'],
              }}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
