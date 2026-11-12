'use client';

import { useEffect, useMemo } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import {
  ThemeProvider as MuiThemeProvider,
  type Theme,
  type ThemeOptions,
  type ThemeProviderProps as MuiThemeProviderProps,
} from '@mui/material/styles';

import { useSettingsContext } from '@/src/components/settings';

import type { ThemeColorScheme, ThemeContrast, ThemeDirection, ThemeSettings } from './types';

import { themeConfig } from './theme-config';
import { createTheme } from './create-theme';

// ----------------------------------------------------------------------

export type ThemeProviderProps = Omit<MuiThemeProviderProps<Theme>, 'theme'> & {
  themeOverrides?: ThemeOptions;
};

// ----------------------------------------------------------------------

/*
 * `Settings` is an untyped record, so each value is narrowed before it reaches
 * the theme instead of being cast.
 */
function toColorScheme(value: unknown): ThemeColorScheme | undefined {
  return value === 'light' || value === 'dark' ? value : undefined;
}

function toDirection(value: unknown): ThemeDirection | undefined {
  return value === 'ltr' || value === 'rtl' ? value : undefined;
}

function toContrast(value: unknown): ThemeContrast | undefined {
  return value === 'default' || value === 'hight' ? value : undefined;
}

function toFontFamily(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

// ----------------------------------------------------------------------

/**
 * Pushes the one setting a Material UI theme cannot express on its own: the
 * document direction.
 *
 * The color scheme is deliberately **not** synced from here. MUI's
 * `useColorScheme` owns it — it persists the choice under `mui-mode` and
 * `InitColorSchemeScript` applies it before paint. This component used to
 * also force the mode to the settings record's `colorScheme`, which nothing
 * ever updates (the settings drawer is not mounted), so every click on the
 * header's moon set `dark` and was put straight back to `light` on the next
 * render: the toggle did nothing at all.
 */
function SettingsSync({ direction }: { direction?: ThemeDirection }) {
  useEffect(() => {
    document.documentElement.dir = direction ?? themeConfig.direction;
  }, [direction]);

  return null;
}

// ----------------------------------------------------------------------

export function ThemeProvider({ children, themeOverrides ,...other }: ThemeProviderProps) {
  const settings = useSettingsContext();

  const settingsState = useMemo<Partial<ThemeSettings>>(
    () => ({
      colorScheme: toColorScheme(settings.colorScheme),
      direction: toDirection(settings.direction),
      contrast: toContrast(settings.contrast),
      fontFamily: toFontFamily(settings.fontFamily),
    }),
    [settings.colorScheme, settings.direction, settings.contrast, settings.fontFamily]
  );

  const theme = useMemo(
    () => createTheme({ settings: settingsState, themeOverrides }),
    [settingsState, themeOverrides]
  );

  return (
    <MuiThemeProvider
      theme={theme}
      defaultMode={themeConfig.defaultMode}
      modeStorageKey={themeConfig.modeStorageKey}
      colorSchemeStorageKey={themeConfig.colorSchemeStorageKey}
      {...other}
    >
      <CssBaseline />
      <SettingsSync direction={settingsState.direction} />
      {children}
    </MuiThemeProvider>
  );
}
