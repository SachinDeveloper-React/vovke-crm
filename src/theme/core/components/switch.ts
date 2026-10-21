import type { ThemeComponents } from '../../types';

// ----------------------------------------------------------------------

const MuiSwitch: ThemeComponents['MuiSwitch'] = {
  defaultProps: {
    color: 'primary',
  },
  styleOverrides: {
    track: ({ theme }) => ({
      opacity: 1,
      backgroundColor: theme.alpha(theme.vars.palette.grey['500'], 0.48),
    }),
    thumb: ({ theme }) => ({
      color: theme.vars.palette.common.white,
      ...theme.applyStyles('dark', {
        color: theme.vars.palette.grey['300'],
      }),
    }),
    switchBase: ({ theme }) => ({
      '&.Mui-checked + .MuiSwitch-track': {
        opacity: 1,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.vars.palette.action.disabledBackground,
      },
    }),
  },
};

// ----------------------------------------------------------------------

export const switches: ThemeComponents = {
  MuiSwitch,
};
