import type { ThemeComponents } from '../../types';

import { opacity } from '../opacity';

// ----------------------------------------------------------------------

const MuiPaper: ThemeComponents['MuiPaper'] = {
  defaultProps: {
    elevation: 0,
  },
  styleOverrides: {
    root: {
      backgroundImage: 'none',
    },
    outlined: ({ theme }) => ({
      borderColor: theme.alpha(theme.vars.palette.grey['500'], opacity.border),
    }),
  },
};

// ----------------------------------------------------------------------

export const paper: ThemeComponents = {
  MuiPaper,
};
