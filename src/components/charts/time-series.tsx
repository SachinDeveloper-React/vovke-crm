'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { dayTick, formatBy } from '@/src/lib/format';

import { chrome, series as seriesColors, seriesWash, type ValueFormat } from './tokens';
import { useChartWidth } from './use-chart-width';

export type SeriesSpec = { key: string; label: string };

type TimeSeriesProps = {
  /** One row per day, newest last. `date` is a `YYYY-MM-DD` local day. */
  data: Record<string, string | number>[];
  /** One or two series. Two is the cap — see `tokens.ts`. */
  series: SeriesSpec[];
  height?: number;
  valueFormat?: ValueFormat;
  /** A y-axis that starts somewhere other than zero is a lie about change. */
  ariaLabel?: string;
};

const PAD = { top: 16, right: 16, bottom: 26, left: 44 };

/**
 * Change over time: a 2px line per series, the single-series case washed
 * underneath at a tenth, and a crosshair with a tooltip on hover.
 *
 * One y-axis, always — two measures of different scale become two charts
 * (the dual axis is the mistake that makes every reader guess which line
 * belongs to which side).
 */
export function TimeSeries({ data, series, height = 240, valueFormat = 'compact', ariaLabel }: TimeSeriesProps) {
  const { ref, width } = useChartWidth();
  const [hover, setHover] = useState<number | null>(null);

  const plot = useMemo(() => {
    const innerWidth = Math.max(80, width - PAD.left - PAD.right);
    const innerHeight = Math.max(60, height - PAD.top - PAD.bottom);
    const values = data.flatMap(row => series.map(spec => Number(row[spec.key] ?? 0)));
    const max = Math.max(1, ...values);
    // Clean ticks: the next round number above the peak, in four steps.
    const magnitude = 10 ** Math.floor(Math.log10(max));
    const step = Math.ceil(max / 4 / magnitude) * magnitude;
    const ceiling = step * 4;
    const x = (index: number) =>
      PAD.left + (data.length <= 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);
    const y = (value: number) => PAD.top + innerHeight - (value / ceiling) * innerHeight;
    return {
      innerWidth,
      innerHeight,
      ceiling,
      ticks: [0, step, step * 2, step * 3, step * 4],
      x,
      y,
      lines: series.map(spec => data.map((row, index) => [x(index), y(Number(row[spec.key] ?? 0))] as const)),
    };
  }, [data, series, width, height]);

  if (data.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.disabled',
          typography: 'body2',
        }}
      >
        Nothing in this window yet.
      </Box>
    );
  }

  const hovered = hover === null ? null : data[hover];
  // Keep the tooltip inside the box: it flips to the left of the crosshair
  // once the point is past the middle.
  const hoverX = hover === null ? 0 : plot.x(hover);
  const flip = hoverX > PAD.left + plot.innerWidth / 2;

  return (
    <Box ref={ref} sx={{ position: 'relative', width: '100%' }}>
      <Box
        component="svg"
        role="img"
        aria-label={ariaLabel ?? series.map(spec => spec.label).join(' and ')}
        width={width}
        height={height}
        sx={{ display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={event => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const offset = event.clientX - bounds.left - PAD.left;
          const ratio = plot.innerWidth === 0 ? 0 : offset / plot.innerWidth;
          const index = Math.round(ratio * Math.max(1, data.length - 1));
          setHover(Math.min(data.length - 1, Math.max(0, index)));
        }}
      >
        {/* Gridlines and their ticks — recessive, and carrying the values no label does. */}
        {plot.ticks.map(tick => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={PAD.left + plot.innerWidth}
              y1={plot.y(tick)}
              y2={plot.y(tick)}
              stroke={chrome.grid}
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={plot.y(tick) + 4}
              textAnchor="end"
              fill={chrome.axis}
              style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}
            >
              {formatBy(valueFormat === 'percent' ? 'percent' : 'compact', tick)}
            </text>
          </g>
        ))}

        {/* The date axis, thinned to about six labels however long the window is. */}
        {data.map((row, index) => {
          const every = Math.ceil(data.length / 6);
          if (index % every !== 0 && index !== data.length - 1) return null;
          return (
            <text
              key={`tick-${String(row.date)}`}
              x={plot.x(index)}
              y={height - 8}
              textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'}
              fill={chrome.axis}
              style={{ fontSize: 11 }}
            >
              {dayTick(String(row.date))}
            </text>
          );
        })}

        {/* A single series gets the wash; two would fight each other for it. */}
        {series.length === 1 && (
          <path
            d={`M ${plot.lines[0].map(([x, y]) => `${x},${y}`).join(' L ')} L ${plot.x(data.length - 1)},${plot.y(0)} L ${plot.x(0)},${plot.y(0)} Z`}
            fill={seriesWash[0]}
            stroke="none"
          />
        )}

        {plot.lines.map((points, index) => (
          <path
            key={series[index].key}
            d={`M ${points.map(([x, y]) => `${x},${y}`).join(' L ')}`}
            fill="none"
            stroke={seriesColors[index]}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* The end-dot, with its 2px surface ring, so the latest value is findable. */}
        {plot.lines.map((points, index) => {
          const last = points[points.length - 1];
          return (
            <circle
              key={`end-${series[index].key}`}
              cx={last[0]}
              cy={last[1]}
              r={4}
              fill={seriesColors[index]}
              stroke={chrome.surface}
              strokeWidth={2}
            />
          );
        })}

        {hover !== null && (
          <g>
            <line
              x1={hoverX}
              x2={hoverX}
              y1={PAD.top}
              y2={PAD.top + plot.innerHeight}
              stroke={chrome.axis}
              strokeWidth={1}
            />
            {series.map((spec, index) => (
              <circle
                key={`hover-${spec.key}`}
                cx={hoverX}
                cy={plot.y(Number(data[hover][spec.key] ?? 0))}
                r={4}
                fill={seriesColors[index]}
                stroke={chrome.surface}
                strokeWidth={2}
              />
            ))}
          </g>
        )}
      </Box>

      {hovered && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: 8,
            left: flip ? undefined : Math.min(hoverX + 12, width - 12),
            right: flip ? Math.max(width - hoverX + 12, 12) : undefined,
            px: 1.25,
            py: 0.75,
            pointerEvents: 'none',
            minWidth: 128,
            borderRadius: 1.5,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
            {dayTick(String(hovered.date))}
          </Typography>
          {series.map((spec, index) => (
            <Stack key={spec.key} direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: seriesColors[index], flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1, whiteSpace: 'nowrap' }}>
                {spec.label}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {formatBy(valueFormat, Number(hovered[spec.key] ?? 0))}
              </Typography>
            </Stack>
          ))}
        </Paper>
      )}

      {/* Two series always carry a legend; one is already named by the title. */}
      {series.length > 1 && (
        <Stack direction="row" spacing={2} sx={{ mt: 1, pl: `${PAD.left}px` }}>
          {series.map((spec, index) => (
            <Stack key={spec.key} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 10, height: 2, borderRadius: 1, bgcolor: seriesColors[index] }} />
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
