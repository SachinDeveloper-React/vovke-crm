import type { ThemeComponents } from '../../types';

import { themeConfig } from '../../theme-config';

// ----------------------------------------------------------------------

const MuiAutocomplete: ThemeComponents['MuiAutocomplete'] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      boxShadow: theme.vars.customShadows.dropdown,
      borderRadius: themeConfig.shape.borderRadius * 1.25,
    }),
    listbox: ({ theme }) => ({
      padding: 0,
      '& .MuiAutocomplete-option': {
        fontSize: theme.typography.body2.fontSize,
        borderRadius: themeConfig.shape.borderRadius * 0.75,
        '&[aria-selected="true"]': {
          backgroundColor: theme.vars.palette.action.selected,
        },
      },
    }),
    endAdornment: {
      top: 'calc(50% - 14px)',
    },
  },
};

// ----------------------------------------------------------------------

export const autocomplete: ThemeComponents = {
  MuiAutocomplete,
};
