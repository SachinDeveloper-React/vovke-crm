'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { dayTick, formatBy } from '@/src/lib/format';

import { chrome, series as seriesColors, type ValueFormat } from './tokens';
import type { SeriesSpec } from './time-series';

type ColumnChartProps = {
  data: Record<string, string | number>[];
  /** One or two series; two are stacked, separated by the 2px surface gap. */
  series: SeriesSpec[];
  height?: number;
  valueFormat?: ValueFormat;
  ariaLabel?: string;
};

const AXIS_WIDTH = 44;
const TICK_HEIGHT = 24;

/**
 * Magnitude by day: columns from a single baseline, capped at 24px thick so
 * the band keeps its air, with a 4px rounded cap at the data end and square
 * feet on the baseline.
 *
 * Laid out in CSS rather than SVG on purpose — the bars then stay crisp at
 * any width without a transform scaling their corners, and the 2px gap that
 * separates touching marks is the gap property doing exactly what it says.
 */
export function ColumnChart({ data, series, height = 240, valueFormat = 'compact', ariaLabel }: ColumnChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const { ticks, ceiling } = useMemo(() => {
    const totals = data.map(row => series.reduce((sum, spec) => sum + Number(row[spec.key] ?? 0), 0));
    const max = Math.max(1, ...totals);
    const magnitude = 10 ** Math.floor(Math.log10(max));
    const step = Math.ceil(max / 4 / magnitude) * magnitude;
    return { ticks: [0, step, step * 2, step * 3, step * 4], ceiling: step * 4 };
  }, [data, series]);

  if (data.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled', typography: 'body2' }}>
        Nothing in this window yet.
      </Box>
    );
  }

  const plotHeight = height - TICK_HEIGHT;
  const every = Math.ceil(data.length / 8);

  return (
    <Box sx={{ position: 'relative', width: '100%' }} aria-label={ariaLabel} role="img">
      <Box sx={{ position: 'relative', height: plotHeight, ml: `${AXIS_WIDTH}px` }}>
        {ticks.map(tick => (
          <Box
            key={tick}
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${(tick / ceiling) * 100}%`,
              borderTop: '1px solid',
              borderColor: chrome.grid,
            }}
          >
            <Typography
              component="span"
              sx={{
                position: 'absolute',
                right: '100%',
                mr: 1,
                transform: 'translateY(-50%)',
                fontSize: 11,
                color: 'text.disabled',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {formatBy(valueFormat === 'percent' ? 'percent' : 'compact', tick)}
            </Typography>
          </Box>
        ))}

        <Stack direction="row" spacing="2px" sx={{ alignItems: 'flex-end', position: 'absolute', inset: 0 }}>
          {data.map((row, index) => {
            const total = series.reduce((sum, spec) => sum + Number(row[spec.key] ?? 0), 0);
            return (
              <Box
                key={String(row.date)}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
                sx={{ flex: 1, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', cursor: 'default' }}
              >
                <Stack
                  direction="column-reverse"
                  spacing="2px"
                  sx={{
                    width: '100%',
                    maxWidth: 24,
                    height: `${(total / ceiling) * 100}%`,
                    minHeight: total > 0 ? 2 : 0,
                    opacity: hover === null || hover === index ? 1 : 0.55,
                    transition: 'opacity 120ms linear',
                  }}
                >
                  {series.map((spec, seriesIndex) => {
                    const value = Number(row[spec.key] ?? 0);
                    if (value <= 0) return null;
                    const isTop = series.slice(seriesIndex + 1).every(rest => Number(row[rest.key] ?? 0) <= 0);
                    return (
                      <Box
                        key={spec.key}
                        sx={{
                          height: total > 0 ? `${(value / total) * 100}%` : 0,
                          bgcolor: seriesColors[seriesIndex],
                          borderRadius: isTop ? '4px 4px 0 0' : 0,
                        }}
                      />
                    );
                  })}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Box>

      <Stack direction="row" spacing="2px" sx={{ ml: `${AXIS_WIDTH}px`, height: TICK_HEIGHT, pt: 0.75 }}>
        {data.map((row, index) => (
          <Box key={`tick-${String(row.date)}`} sx={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            {(index % every === 0 || index === data.length - 1) && (
              <Typography component="span" sx={{ fontSize: 11, color: 'text.disabled', whiteSpace: 'nowrap' }}>
                {dayTick(String(row.date))}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>

      {hover !== null && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: 0,
            left: `calc(${AXIS_WIDTH}px + ${((hover + 0.5) / data.length) * 100}% )`,
            transform: hover > data.length / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
            px: 1.25,
            py: 0.75,
            pointerEvents: 'none',
            minWidth: 136,
            borderRadius: 1.5,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
            {dayTick(String(data[hover].date))}
          </Typography>
          {series.map((spec, index) => (
            <Stack key={spec.key} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: seriesColors[index], flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1, whiteSpace: 'nowrap' }}>
                {spec.label}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {formatBy(valueFormat, Number(data[hover][spec.key] ?? 0))}
              </Typography>
            </Stack>
          ))}
        </Paper>
      )}

      {series.length > 1 && (
        <Stack direction="row" spacing={2} sx={{ mt: 1, pl: `${AXIS_WIDTH}px` }}>
          {series.map((spec, index) => (
            <Stack key={spec.key} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: seriesColors[index] }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {spec.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}
