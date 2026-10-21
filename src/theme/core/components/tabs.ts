import type { ThemeComponents } from '../../types';

// ----------------------------------------------------------------------

const MuiTabs: ThemeComponents['MuiTabs'] = {
  styleOverrides: {
    indicator: ({ theme }) => ({
      backgroundColor: theme.vars.palette.text.primary,
    }),
  },
};

// ----------------------------------------------------------------------

const MuiTab: ThemeComponents['MuiTab'] = {
  defaultProps: {
    disableRipple: true,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      opacity: 1,
      minWidth: 48,
      minHeight: 48,
      fontWeight: theme.typography.fontWeightSemiBold,
      color: theme.vars.palette.text.secondary,
      '&.Mui-selected': {
        color: theme.vars.palette.text.primary,
      },
    }),
  },
};

// ----------------------------------------------------------------------

export const tabs: ThemeComponents = {
  MuiTabs,
  MuiTab,
};
