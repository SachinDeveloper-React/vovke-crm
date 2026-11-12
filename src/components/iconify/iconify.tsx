'use client';

import { forwardRef, type ComponentRef } from 'react';

import { addCollection, Icon, setCustomIconsLoader, type IconifyJSON, type IconProps } from '@iconify/react';

import Box from '@mui/material/Box';
import NoSsr from '@mui/material/NoSsr';
import type { SxProps, Theme } from '@mui/material/styles';

import { iconifyClasses } from './classes';
import { ICON_SETS, ICON_VERSION } from './icon-data';
import { ICON_PREFIXES } from './icon-prefixes';

// Icons never come from api.iconify.design: the CSP (`connect-src 'self'`)
// refuses that request, and the icon — and any icon-only button around it —
// would render as nothing. The shell's icons are bundled and registered up
// front; every other one is fetched from this app's own `/iconify` route,
// batched per render, at a versioned URL the browser and the service worker
// keep forever. `npm run icons` rewrites both halves; `icons.test.ts` fails
// when a newly named icon is in neither.
for (const set of ICON_SETS) addCollection(set);

const loadPageIcons = async (icons: string[], prefix: string): Promise<IconifyJSON | null> => {
  try {
    const query = encodeURIComponent([...icons].sort().join(','));
    const response = await fetch(`/iconify/${ICON_VERSION}/${prefix}?icons=${query}`);
    return response.ok ? ((await response.json()) as IconifyJSON) : null;
  } catch {
    return null;
  }
};
for (const prefix of ICON_PREFIXES) setCustomIconsLoader(loadPageIcons, prefix);

// ----------------------------------------------------------------------

type IconRef = ComponentRef<typeof Icon>;

export type IconifyProps = Omit<IconProps, 'width' | 'height'> & {
  width?: number;
  sx?: SxProps<Theme>;
};

// ----------------------------------------------------------------------

export const Iconify = forwardRef<IconRef, IconifyProps>(
  ({ className, width = 20, sx, ...other }, ref) => {
    const classes = [
      iconifyClasses.root,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const baseStyles = {
      width,
      height: width,
      flexShrink: 0,
      display: 'inline-flex',
    };

    const renderFallback = (
      <Box
        component="span"
        className={classes}
        sx={{
          ...baseStyles,
          ...sx,
        }}
      />
    );

    return (
      <NoSsr fallback={renderFallback}>
        <Box
          ref={ref}
          component={Icon}
          className={classes}
          sx={{
            ...baseStyles,
            ...sx,
          }}
          {...other}
        />
      </NoSsr>
    );
  }
);

Iconify.displayName = 'Iconify';