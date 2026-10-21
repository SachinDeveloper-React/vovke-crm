import type { ThemeComponents } from '../../types';

// ----------------------------------------------------------------------

const MuiCheckbox: ThemeComponents['MuiCheckbox'] = {
  defaultProps: {
    size: 'small',
    color: 'primary',
  },
  styleOverrides: {
    root: ({ theme }) => ({
      padding: 9,
      '&.Mui-disabled': {
        color: theme.vars.palette.action.disabled,
      },
    }),
  },
};

// ----------------------------------------------------------------------

export const checkbox: ThemeComponents = {
  MuiCheckbox,
};
