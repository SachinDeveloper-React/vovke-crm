import type { ThemeComponents } from '../../types';

// ----------------------------------------------------------------------

const MuiRadio: ThemeComponents['MuiRadio'] = {
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

export const radio: ThemeComponents = {
  MuiRadio,
};
