import type { ThemeContrast, ThemeDirection, ThemeColorScheme } from './types';

// ----------------------------------------------------------------------

/**
 * Single source of truth for every non-color theme decision.
 *
 * Colors are not configured here, they live in `core/colors.json`.
 */
export const themeConfig = {
  /**
   * Material UI CSS theme variables.
   * `colorSchemeSelector: 'class'` makes MUI emit `.light` / `.dark` rules on the
   * element targeted by `<InitColorSchemeScript attribute="class" />`.
   */
  cssVariables: {
    cssVarPrefix: 'mui',
    colorSchemeSelector: 'class',
  },
  /** Color scheme */
  defaultMode: 'light' as ThemeColorScheme,
  modeStorageKey: 'mui-mode',
  colorSchemeStorageKey: 'mui-color-scheme',
  /** Settings defaults, mirrors `components/settings/config-settings.ts` */
  direction: 'ltr' as ThemeDirection,
  contrast: 'default' as ThemeContrast,
  /**
   * Font families.
   * Both values are the `next/font` CSS variables declared in `src/app/layout.tsx`.
   */
  fontFamily: {
    primary: 'var(--font-geist-sans)',
    secondary: 'var(--font-geist-mono)',
  },
  /** Shape & spacing */
  shape: { borderRadius: 8 },
  spacing: 8,
} as const;

// ----------------------------------------------------------------------

/**
 * Builds a reference to a generated CSS theme variable, for tokens that must be
 * resolved by the browser instead of at theme creation time (shadow colors, for example).
 *
 * @example themeVar('palette-shadowChannel') // 'var(--mui-palette-shadowChannel)'
 */
export function themeVar(name: string): string {
  return `var(--${themeConfig.cssVariables.cssVarPrefix}-${name})`;
}
