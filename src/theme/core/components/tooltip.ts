import type { ThemeComponents } from '../../types';

// ----------------------------------------------------------------------

const MuiTooltip: ThemeComponents['MuiTooltip'] = {
  styleOverrides: {
    tooltip: ({ theme }) => ({
      backgroundColor: theme.vars.palette.grey['800'],
      ...theme.applyStyles('dark', {
        backgroundColor: theme.vars.palette.grey['700'],
      }),
    }),
    arrow: ({ theme }) => ({
      color: theme.vars.palette.grey['800'],
      ...theme.applyStyles('dark', {
        color: theme.vars.palette.grey['700'],
      }),
    }),
  },
};

// ----------------------------------------------------------------------

export const tooltip: ThemeComponents = {
  MuiTooltip,
};
