/**
 * The chart parameters, in one place.
 *
 * The two series colors are the theme's own `primary.main` (#00A76F) and
 * `secondary.main` (#8E33FF), which were run through the palette validator
 * against this panel's surfaces — paper #FFFFFF light, #1C252E dark — and
 * clear every gate in both modes on all pairs: CVD ΔE 27.9, normal-vision
 * ΔE 39.5, both above 3:1 against either surface.
 *
 * That is also why **no chart here carries more than two series**: a third
 * brand hue was not validated, and a chart is never the place to find out.
 * Where a third dimension is wanted it becomes a second chart, or a ranked
 * list — never a third color.
 *
 * Marks wear these. Text never does: labels, values and ticks use the text
 * tokens below, with the colored mark beside them carrying identity.
 */
export const series = ['var(--mui-palette-primary-main)', 'var(--mui-palette-secondary-main)'] as const;

/** A wash, never a block: the series hue at a tenth. */
export const seriesWash = [
  'color-mix(in srgb, var(--mui-palette-primary-main) 12%, transparent)',
  'color-mix(in srgb, var(--mui-palette-secondary-main) 12%, transparent)',
] as const;

export const chrome = {
  /** Hairline, solid, one step off the surface. Never dashed. */
  grid: 'var(--mui-palette-divider)',
  axis: 'var(--mui-palette-text-disabled)',
  tick: 'var(--mui-palette-text-secondary)',
  /** What the 2px separators and rings are painted in. */
  surface: 'var(--mui-palette-background-paper)',
  /** A sparkline's own line, before the accent takes the last point. */
  muted: 'var(--mui-palette-text-disabled)',
} as const;

export type ValueFormat = 'number' | 'compact' | 'coins' | 'rupees' | 'percent';
