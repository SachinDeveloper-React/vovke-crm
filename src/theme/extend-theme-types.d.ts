import type { CustomShadows, PaletteStatusColors } from './types';

// ----------------------------------------------------------------------

declare module '@mui/material/styles' {
  /**
   * Opts the theme into CSS theme variables, which makes `theme.vars`,
   * `theme.colorSchemes` and `theme.getCssVar` part of the `Theme` type.
   */
  interface CssThemeVariables {
    enabled: true;
  }

  /** Extra tones coming from `core/colors.json`. */
  interface PaletteColor {
    lighter: string;
    darker: string;
  }

  interface SimplePaletteColorOptions {
    lighter?: string;
    darker?: string;
  }

  interface PaletteColorChannel {
    lighterChannel: string;
    darkerChannel: string;
  }

  interface CommonColors {
    blackChannel: string;
    whiteChannel: string;
  }

  interface Color {
    '50Channel': string;
    '100Channel': string;
    '200Channel': string;
    '300Channel': string;
    '400Channel': string;
    '500Channel': string;
    '600Channel': string;
    '700Channel': string;
    '800Channel': string;
    '900Channel': string;
  }

  interface TypeText {
    disabledChannel: string;
  }

  interface TypeBackground {
    neutral: string;
    neutralChannel: string;
  }

  interface Palette extends PaletteStatusColors {
    /** Channel used to tint both the `shadows` and the `customShadows` scales. */
    shadowChannel: string;
  }

  interface PaletteOptions extends Partial<PaletteStatusColors> {
    shadowChannel?: string;
  }

  interface Theme {
    customShadows: CustomShadows;
  }

  interface ThemeOptions {
    customShadows?: CustomShadows;
  }

  interface ThemeVars {
    customShadows: CustomShadows;
  }

  /**
   * `FontStyle` is not re-exported by `@mui/material/styles`, so the extra font
   * tokens are declared on the typography interfaces directly.
   */
  interface TypographyVariants {
    fontWeightSemiBold: number;
    fontSecondaryFamily: string;
  }

  interface TypographyVariantsOptions {
    fontWeightSemiBold?: number;
    fontSecondaryFamily?: string;
  }
}
