
'use client';

import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

import { StyledLabel } from './styles';
import { labelClasses } from './classes';

// ----------------------------------------------------------------------

type LabelColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

type LabelVariant = 'filled' | 'outlined' | 'soft' | 'inverted';

type LabelProps = Omit<ComponentPropsWithoutRef<'span'>, 'color'> & {
  children?: ReactNode;
  color?: LabelColor;
  variant?: LabelVariant;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  sx?: SxProps<Theme>;
};

// ----------------------------------------------------------------------

export const Label = forwardRef<HTMLSpanElement, LabelProps>(
  (
    {
      children,
      color = 'default',
      variant = 'soft',
      startIcon,
      endIcon,
      sx,
      className,
      ...other
    },
    ref
  ) => {

    const iconStyles = {
      width: 16,
      height: 16,
      '& svg, img': {
        width: 1,
        height: 1,
        objectFit: 'cover',
      },
    };

    return (
      <StyledLabel
        {...other}
        ref={ref}
        className={labelClasses.root.concat(
          className ? ` ${className}` : ''
        )}
        ownerState={{ color, variant }}
        sx={[
          {
            ...(startIcon && { pl: 0.75 }),
            ...(endIcon && { pr: 0.75 }),
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {startIcon && (
          <Box
            component="span"
            className={labelClasses.icon}
            sx={{ mr: 0.75, ...iconStyles }}
          >
            {startIcon}
          </Box>
        )}

        {typeof children === 'string'
          ? sentenceCase(children)
          : children}

        {endIcon && (
          <Box
            component="span"
            className={labelClasses.icon}
            sx={{ ml: 0.75, ...iconStyles }}
          >
            {endIcon}
          </Box>
        )}
      </StyledLabel>
    );
  }
);

Label.displayName = 'Label';

// ----------------------------------------------------------------------

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}