import { forwardRef, type ComponentRef } from 'react';

import Box, { type BoxProps } from '@mui/material/Box';

import { svgColorClasses } from './classes';

// ----------------------------------------------------------------------

export type SvgColorProps = Omit<BoxProps, 'component' | 'color'> & {
  src: string;
  width?: number;
  height?: number;
};

// ----------------------------------------------------------------------

type SvgColorRef = ComponentRef<typeof Box>;

// ----------------------------------------------------------------------

export const SvgColor = forwardRef<SvgColorRef, SvgColorProps>(
  (
    {
      src,
      width = 24,
      height,
      className,
      sx,
      ...other
    },
    ref
  ) => {
    const classes = [
      svgColorClasses.root,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <Box
        ref={ref}
        component="span"
        className={classes}
        sx={{
          width,
          flexShrink: 0,
          height: height ?? width,
          display: 'inline-flex',
          bgcolor: 'currentColor',
          mask: `url(${src}) no-repeat center / contain`,
          WebkitMask: `url(${src}) no-repeat center / contain`,
          ...sx,
        }}
        {...other}
      />
    );
  }
);

SvgColor.displayName = 'SvgColor';