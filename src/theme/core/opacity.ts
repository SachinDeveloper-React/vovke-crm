// ----------------------------------------------------------------------

/**
 * Shared alpha tokens.
 *
 * `colors.json` only carries hex values, so every translucent token in the
 * theme is expressed here as an alpha applied to one of its channels.
 */
export const opacity = {
  /** Interaction states, applied to `grey.500Channel` */
  hover: 0.08,
  selected: 0.16,
  focus: 0.24,
  activated: 0.24,
  disabled: 0.8,
  disabledBackground: 0.24,
  /** Borders & dividers */
  divider: 0.2,
  border: 0.16,
  outlinedBorder: 0.48,
  /** Surfaces */
  soft: 0.08,
  softHover: 0.16,
  backdrop: 0.8,
  neutral: 0.12,
  /** Shadows */
  shadowKey: 0.2,
  shadowPenumbra: 0.14,
  shadowAmbient: 0.12,
  shadowCustom: 0.16,
  shadowColored: 0.24,
} as const;
