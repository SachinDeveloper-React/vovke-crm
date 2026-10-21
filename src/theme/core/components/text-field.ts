import { outlinedInputClasses } from '@mui/material/OutlinedInput';

import type { ThemeComponents } from '../../types';

import { opacity } from '../opacity';

// ----------------------------------------------------------------------

const MuiTextField: ThemeComponents['MuiTextField'] = {
  defaultProps: {
    variant: 'outlined',
  },
};

// ----------------------------------------------------------------------

const MuiInputBase: ThemeComponents['MuiInputBase'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      '&.Mui-disabled': {
        '& svg': {
          color: theme.vars.palette.text.disabled,
        },
      },
    }),
    input: ({ theme }) => ({
      fontSize: theme.typography.body2.fontSize,
      '&::placeholder': {
        opacity: 1,
        color: theme.vars.palette.text.disabled,
      },
    }),
  },
};

// ----------------------------------------------------------------------

const MuiInputLabel: ThemeComponents['MuiInputLabel'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      fontSize: theme.typography.body2.fontSize,
      color: theme.vars.palette.text.disabled,
      '&.Mui-focused': {
        color: theme.vars.palette.text.primary,
      },
      '&.Mui-error': {
        color: theme.vars.palette.error.main,
      },
      '&.Mui-disabled': {
        color: theme.vars.palette.text.disabled,
      },
    }),
  },
};

// ----------------------------------------------------------------------

const MuiOutlinedInput: ThemeComponents['MuiOutlinedInput'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      [`&:hover .${outlinedInputClasses.notchedOutline}`]: {
        borderColor: theme.alpha(theme.vars.palette.grey['500'], opacity.outlinedBorder),
      },
      [`&.Mui-focused .${outlinedInputClasses.notchedOutline}`]: {
        borderWidth: 1,
        borderColor: theme.vars.palette.text.primary,
      },
      [`&.Mui-error .${outlinedInputClasses.notchedOutline}`]: {
        borderColor: theme.vars.palette.error.main,
      },
      [`&.Mui-disabled .${outlinedInputClasses.notchedOutline}`]: {
        borderColor: theme.vars.palette.action.disabledBackground,
      },
    }),
    notchedOutline: ({ theme }) => ({
      transition: theme.transitions.create(['border-color']),
      borderColor: theme.alpha(theme.vars.palette.grey['500'], opacity.border),
    }),
  },
};

// ----------------------------------------------------------------------

export const textField: ThemeComponents = {
  MuiTextField,
  MuiInputBase,
  MuiInputLabel,
  MuiOutlinedInput,
};
