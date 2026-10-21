import type { ThemeComponents } from '../../types';

import { opacity } from '../opacity';

// ----------------------------------------------------------------------

const MuiTableContainer: ThemeComponents['MuiTableContainer'] = {
  styleOverrides: {
    root: {
      position: 'relative',
    },
  },
};

// ----------------------------------------------------------------------

const MuiTableHead: ThemeComponents['MuiTableHead'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      '& .MuiTableCell-head': {
        color: theme.vars.palette.text.secondary,
        backgroundColor: theme.vars.palette.background.neutral,
      },
    }),
  },
};

// ----------------------------------------------------------------------

const MuiTableCell: ThemeComponents['MuiTableCell'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      borderBottomStyle: 'dashed',
      borderBottomColor: theme.alpha(theme.vars.palette.grey['500'], opacity.divider),
    }),
    head: ({ theme }) => ({
      fontSize: theme.typography.subtitle2.fontSize,
      fontWeight: theme.typography.fontWeightSemiBold,
    }),
    paddingCheckbox: {
      paddingLeft: 12,
    },
  },
};

// ----------------------------------------------------------------------

const MuiTableRow: ThemeComponents['MuiTableRow'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      '&.Mui-selected': {
        backgroundColor: theme.vars.palette.action.selected,
        '&:hover': {
          backgroundColor: theme.vars.palette.action.hover,
        },
      },
      '&:last-of-type .MuiTableCell-root': {
        borderColor: 'transparent',
      },
    }),
  },
};

// ----------------------------------------------------------------------

const MuiTablePagination: ThemeComponents['MuiTablePagination'] = {
  styleOverrides: {
    root: {
      borderTop: 0,
    },
    toolbar: {
      height: 64,
    },
    actions: {
      marginRight: 8,
    },
  },
};

// ----------------------------------------------------------------------

export const table: ThemeComponents = {
  MuiTableContainer,
  MuiTableHead,
  MuiTableCell,
  MuiTableRow,
  MuiTablePagination,
};
