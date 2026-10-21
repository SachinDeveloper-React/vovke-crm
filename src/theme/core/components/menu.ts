import type { ThemeComponents } from '../../types';

import { themeConfig } from '../../theme-config';

// ----------------------------------------------------------------------

const MuiMenu: ThemeComponents['MuiMenu'] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      boxShadow: theme.vars.customShadows.dropdown,
      borderRadius: themeConfig.shape.borderRadius * 1.25,
      backgroundColor: theme.vars.palette.background.paper,
    }),
  },
};

// ----------------------------------------------------------------------

const MuiMenuItem: ThemeComponents['MuiMenuItem'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontSize: theme.typography.body2.fontSize,
      borderRadius: themeConfig.shape.borderRadius * 0.75,
      '&.Mui-selected': {
        backgroundColor: theme.vars.palette.action.selected,
        '&:hover': {
          backgroundColor: theme.vars.palette.action.hover,
        },
      },
    }),
  },
};

// ----------------------------------------------------------------------

export const menu: ThemeComponents = {
  MuiMenu,
  MuiMenuItem,
};
