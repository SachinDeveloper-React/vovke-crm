import type { ThemeComponents } from '../../types';

// ----------------------------------------------------------------------

const MuiIconButton: ThemeComponents['MuiIconButton'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      '&.Mui-disabled': {
        color: theme.vars.palette.action.disabled,
      },
    }),
    sizeSmall: {
      padding: 6,
    },
    sizeMedium: {
      padding: 8,
    },
    sizeLarge: {
      padding: 10,
    },
  },
};

// ----------------------------------------------------------------------

export const iconButton: ThemeComponents = {
  MuiIconButton,
};
