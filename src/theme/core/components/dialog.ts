import type { ThemeComponents } from '../../types';

import { themeConfig } from '../../theme-config';

// ----------------------------------------------------------------------

const MuiDialog: ThemeComponents['MuiDialog'] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      boxShadow: theme.vars.customShadows.dialog,
      borderRadius: themeConfig.shape.borderRadius * 2,
    }),
    paperFullScreen: {
      borderRadius: 0,
    },
  },
};

// ----------------------------------------------------------------------

const MuiDialogTitle: ThemeComponents['MuiDialogTitle'] = {
  styleOverrides: {
    root: {
      padding: themeConfig.spacing * 3,
    },
  },
};

// ----------------------------------------------------------------------

const MuiDialogContent: ThemeComponents['MuiDialogContent'] = {
  styleOverrides: {
    root: {
      padding: themeConfig.spacing * 3,
    },
    dividers: ({ theme }) => ({
      borderTopStyle: 'dashed',
      borderBottomStyle: 'dashed',
      borderColor: theme.vars.palette.divider,
    }),
  },
};

// ----------------------------------------------------------------------

const MuiDialogActions: ThemeComponents['MuiDialogActions'] = {
  styleOverrides: {
    root: {
      padding: themeConfig.spacing * 3,
    },
  },
};

// ----------------------------------------------------------------------

export const dialog: ThemeComponents = {
  MuiDialog,
  MuiDialogTitle,
  MuiDialogContent,
  MuiDialogActions,
};
