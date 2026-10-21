'use client';

import { forwardRef, type ComponentRef } from 'react';

import { Icon, type IconProps } from '@iconify/react';

import Box from '@mui/material/Box';
import NoSsr from '@mui/material/NoSsr';
import type { SxProps, Theme } from '@mui/material/styles';

import { iconifyClasses } from './classes';

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