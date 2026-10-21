import type { Theme, Components, CssVarsTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export type ThemeColorScheme = 'light' | 'dark';

export type ThemeDirection = 'ltr' | 'rtl';

/** `hight` is the value already persisted by the settings drawer, kept as-is. */
export type ThemeContrast = 'default' | 'hight';

/**
 * Subset of `components/settings` that the theme reacts to.
 */
export type ThemeSettings = {
  colorScheme: ThemeColorScheme;
  direction: ThemeDirection;
  contrast: ThemeContrast;
  fontFamily: string;
};

// ----------------------------------------------------------------------

/**
 * Theme shape handed to `styleOverrides` callbacks, matching the signature
 * `ThemeOptions['components']` expects while CSS variables are enabled.
 */
export type ThemeOverridesTheme = Omit<Theme, 'components' | 'palette'> & CssVarsTheme;

export type ThemeComponents = Components<ThemeOverridesTheme>;

// ----------------------------------------------------------------------

/** Status colors carry a `main`/`dark` pair only. */
export type PaletteStatusColor = {
  main: string;
  dark: string;
};

/**
 * CRM specific status colors, used by booking and lead badges.
 */
export type PaletteStatusColors = {
  pending: PaletteStatusColor;
  tkted: PaletteStatusColor;
  manltkt: PaletteStatusColor;
  holdtkt: PaletteStatusColor;
  cancel: PaletteStatusColor;
  test: PaletteStatusColor;
  dupe: PaletteStatusColor;
  refrqst: PaletteStatusColor;
  refprcs: PaletteStatusColor;
  refund: PaletteStatusColor;
  bkgfail: PaletteStatusColor;
  prehold: PaletteStatusColor;
  inprogress: PaletteStatusColor;
  new: PaletteStatusColor;
  hot: PaletteStatusColor;
  warm: PaletteStatusColor;
  cold: PaletteStatusColor;
};

// ----------------------------------------------------------------------

export type CustomShadows = {
  z1: string;
  z4: string;
  z8: string;
  z12: string;
  z16: string;
  z20: string;
  z24: string;
  card: string;
  dialog: string;
  dropdown: string;
  primary: string;
  secondary: string;
  info: string;
  success: string;
  warning: string;
  error: string;
};
