import type { ThemeComponents } from '../../types';

import { opacity } from '../opacity';

// ----------------------------------------------------------------------

const MuiButton: ThemeComponents['MuiButton'] = {
  defaultProps: {
    disableElevation: true,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      fontWeight: theme.typography.fontWeightSemiBold,
    }),
    sizeSmall: {
      minHeight: 30,
    },
    sizeMedium: {
      minHeight: 36,
    },
    sizeLarge: {
      minHeight: 48,
    },
    outlined: ({ theme }) => ({
      borderColor: theme.alpha(theme.vars.palette.grey['500'], opacity.outlinedBorder),
      '&:hover': {
        borderColor: 'currentColor',
        backgroundColor: theme.vars.palette.action.hover,
      },
    }),
  },
  /** Colored elevation on hover, one variant per palette color. */
  variants: [
    {
      props: { variant: 'contained', color: 'primary' },
      style: ({ theme }) => ({ '&:hover': { boxShadow: theme.vars.customShadows.primary } }),
    },
    {
      props: { variant: 'contained', color: 'secondary' },
      style: ({ theme }) => ({ '&:hover': { boxShadow: theme.vars.customShadows.secondary } }),
    },
    {
      props: { variant: 'contained', color: 'info' },
      style: ({ theme }) => ({ '&:hover': { boxShadow: theme.vars.customShadows.info } }),
    },
    {
      props: { variant: 'contained', color: 'success' },
      style: ({ theme }) => ({ '&:hover': { boxShadow: theme.vars.customShadows.success } }),
    },
    {
      props: { variant: 'contained', color: 'warning' },
      style: ({ theme }) => ({ '&:hover': { boxShadow: theme.vars.customShadows.warning } }),
    },
    {
      props: { variant: 'contained', color: 'error' },
      style: ({ theme }) => ({ '&:hover': { boxShadow: theme.vars.customShadows.error } }),
    },
    {
      props: { variant: 'text', color: 'inherit' },
      style: ({ theme }) => ({ '&:hover': { backgroundColor: theme.vars.palette.action.hover } }),
    },
  ],
};

// ----------------------------------------------------------------------

export const button: ThemeComponents = {
  MuiButton,
};
