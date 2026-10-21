'use client';

import Box from '@mui/material/Box';

import { chrome, series as seriesColors } from './tokens';
import { useChartWidth } from './use-chart-width';

/**
 * A stat tile's trend: a muted line with the latest point in the accent, and
 * no axis, no labels and no tooltip — the number beside it is the value, and
 * this only says which way it has been going.
 */
export function Sparkline({ values, height = 28 }: { values: number[]; height?: number }) {
  const { ref, width } = useChartWidth(96);
  if (values.length < 2) return <Box ref={ref} sx={{ height, width: '100%' }} />;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const x = (index: number) => (index / (values.length - 1)) * (width - 6) + 3;
  const y = (value: number) => height - 3 - ((value - min) / span) * (height - 6);
  const last = values.length - 1;

  return (
    <Box ref={ref} sx={{ width: '100%', height }}>
      <Box component="svg" width={width} height={height} aria-hidden sx={{ display: 'block' }}>
        <path
          d={`M ${values.map((value, index) => `${x(index)},${y(value)}`).join(' L ')}`}
          fill="none"
          stroke={chrome.muted}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={x(last)} cy={y(values[last])} r={3} fill={seriesColors[0]} stroke={chrome.surface} strokeWidth={2} />
      </Box>
    </Box>
  );
}
