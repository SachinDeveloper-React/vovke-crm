import type { ThemeComponents } from '../../types';

import { opacity } from '../opacity';

// ----------------------------------------------------------------------

const MuiBackdrop: ThemeComponents['MuiBackdrop'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: theme.alpha(theme.vars.palette.grey['800'], opacity.backdrop),
    }),
    invisible: {
      background: 'transparent',
    },
  },
};

// ----------------------------------------------------------------------

export const backdrop: ThemeComponents = {
  MuiBackdrop,
};
