import type { ThemeComponents } from '../../types';

import { themeConfig } from '../../theme-config';

// ----------------------------------------------------------------------

const MuiCard: ThemeComponents['MuiCard'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      zIndex: 0,
      position: 'relative',
      boxShadow: theme.vars.customShadows.card,
      borderRadius: themeConfig.shape.borderRadius * 2,
    }),
  },
};

// ----------------------------------------------------------------------

const MuiCardHeader: ThemeComponents['MuiCardHeader'] = {
  defaultProps: {
    /** v9 replaced `titleTypographyProps`/`subheaderTypographyProps` with `slotProps`. */
    slotProps: {
      title: { variant: 'h6' },
      subheader: { variant: 'body2' },
    },
  },
  styleOverrides: {
    root: {
      padding: themeConfig.spacing * 3,
    },
  },
};

// ----------------------------------------------------------------------

const MuiCardContent: ThemeComponents['MuiCardContent'] = {
  styleOverrides: {
    root: {
      padding: themeConfig.spacing * 3,
    },
  },
};

// ----------------------------------------------------------------------

export const card: ThemeComponents = {
  MuiCard,
  MuiCardHeader,
  MuiCardContent,
};
