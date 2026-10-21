import type { Theme, ThemeOptions } from '@mui/material/styles';

import { createTheme as createMuiTheme } from '@mui/material/styles';

import type { ThemeContrast, ThemeSettings } from './types';

import { themeConfig } from './theme-config';
import { setFont } from './styles/utils';
import {
  grey,
  components,
  colorSchemes,
  typography,
  createShadows,
  createCustomShadows,
} from './core';

// ----------------------------------------------------------------------

export type CreateThemeProps = {
  /** Values coming from `components/settings`, missing keys fall back to `themeConfig`. */
  settings?: Partial<ThemeSettings>;
  /** Escape hatch for app or page level theme tweaks. */
  themeOverrides?: ThemeOptions;
};

// ----------------------------------------------------------------------

/**
 * High contrast settings.
 *
 * Only the light scheme changes: its canvas moves from `common.white` to
 * `grey.200` so cards separate from the background without a shadow.
 */
function applyContrast(contrast: ThemeContrast): ThemeOptions {
  if (contrast !== 'hight') {
    return {};
  }

  return {
    colorSchemes: {
      light: {
        palette: {
          background: {
            default: grey['200'],
            defaultChannel: grey['200Channel'],
          },
        },
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            boxShadow: theme.vars.customShadows.z1,
          }),
        },
      },
    },
  };
}

// ----------------------------------------------------------------------

/**
 * Composes the palette, typography, shadows, components and shape into a
 * Material UI theme with CSS theme variables enabled, so the light and dark
 * schemes are both emitted up front and swap without a flash.
 */
export function createTheme({ settings, themeOverrides }: CreateThemeProps = {}): Theme {
  const themeSettings: ThemeSettings = {
    colorScheme: settings?.colorScheme ?? themeConfig.defaultMode,
    direction: settings?.direction ?? themeConfig.direction,
    contrast: settings?.contrast ?? themeConfig.contrast,
    fontFamily: settings?.fontFamily ?? themeConfig.fontFamily.primary,
  };

  const themeOptions: ThemeOptions = {
    colorSchemes,
    /**
     * The default scheme owns the `:root` variables, the other one is emitted
     * under `theme.colorSchemeSelector`. Switching happens at runtime through
     * `useColorScheme`, so it stays pinned to the configured default.
     */
    defaultColorScheme: themeConfig.defaultMode,
    cssVariables: themeConfig.cssVariables,
    direction: themeSettings.direction,
    shape: themeConfig.shape,
    spacing: themeConfig.spacing,
    shadows: createShadows(),
    customShadows: createCustomShadows(),
    typography: {
      ...typography,
      fontFamily: setFont(themeSettings.fontFamily),
    },
    components,
  };

  return createMuiTheme(
    themeOptions,
    applyContrast(themeSettings.contrast),
    themeOverrides ?? {}
  );
}
