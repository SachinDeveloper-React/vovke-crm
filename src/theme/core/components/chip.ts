import type { ThemeComponents } from '../../types';

import { opacity } from '../opacity';

// ----------------------------------------------------------------------

const MuiChip: ThemeComponents['MuiChip'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontWeight: theme.typography.fontWeightMedium,
    }),
    label: ({ theme }) => ({
      fontSize: theme.typography.body2.fontSize,
    }),
    outlined: ({ theme }) => ({
      borderColor: theme.alpha(theme.vars.palette.grey['500'], opacity.outlinedBorder),
    }),
    deleteIcon: ({ theme }) => ({
      color: theme.alpha(theme.vars.palette.grey['500'], 0.48),
      '&:hover': {
        color: theme.alpha(theme.vars.palette.grey['500'], 0.72),
      },
    }),
  },
};

// ----------------------------------------------------------------------

export const chip: ThemeComponents = {
  MuiChip,
};
