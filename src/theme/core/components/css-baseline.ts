import type { ThemeComponents } from '../../types';

import { opacity } from '../opacity';

// ----------------------------------------------------------------------

const MuiCssBaseline: ThemeComponents['MuiCssBaseline'] = {
  styleOverrides: (theme) => ({
    '*': {
      boxSizing: 'border-box',
    },
    html: {
      margin: 0,
      padding: 0,
      width: '100%',
      height: '100%',
      WebkitOverflowScrolling: 'touch',
    },
    body: {
      margin: 0,
      padding: 0,
      width: '100%',
      height: '100%',
      color: theme.vars.palette.text.primary,
      backgroundColor: theme.vars.palette.background.default,
    },
    input: {
      '&[type=number]': {
        MozAppearance: 'textfield',
        '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
          margin: 0,
          WebkitAppearance: 'none',
        },
      },
    },
    img: {
      maxWidth: '100%',
      verticalAlign: 'middle',
    },
    /** Scrollbars follow the grey channel from `colors.json`. */
    '*::-webkit-scrollbar': {
      width: 8,
      height: 8,
    },
    '*::-webkit-scrollbar-thumb': {
      borderRadius: 8,
      backgroundColor: theme.alpha(theme.vars.palette.grey['500'], opacity.focus),
      '&:hover': {
        backgroundColor: theme.alpha(theme.vars.palette.grey['500'], opacity.outlinedBorder),
      },
    },
  }),
};

// ----------------------------------------------------------------------

export const cssBaseline: ThemeComponents = {
  MuiCssBaseline,
};
