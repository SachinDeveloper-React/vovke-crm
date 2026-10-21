import type { ThemeComponents } from '../../types';

import { themeConfig } from '../../theme-config';

// ----------------------------------------------------------------------

const MuiAlert: ThemeComponents['MuiAlert'] = {
  defaultProps: {
    variant: 'standard',
  },
  styleOverrides: {
    root: {
      borderRadius: themeConfig.shape.borderRadius,
    },
    icon: {
      opacity: 1,
    },
    message: ({ theme }) => ({
      fontSize: theme.typography.body2.fontSize,
    }),
  },
};

// ----------------------------------------------------------------------

const MuiAlertTitle: ThemeComponents['MuiAlertTitle'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontWeight: theme.typography.fontWeightSemiBold,
      fontSize: theme.typography.subtitle1.fontSize,
    }),
  },
};

// ----------------------------------------------------------------------

export const alert: ThemeComponents = {
  MuiAlert,
  MuiAlertTitle,
};
