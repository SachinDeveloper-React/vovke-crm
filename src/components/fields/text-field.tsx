'use client';

import { forwardRef, useId, useState } from 'react';
import type { ReactNode } from 'react';
import TextField from '@mui/material/TextField';
import type { TextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export type AppTextFieldProps = Omit<TextFieldProps, 'variant'> & {
  name: string;
  variant?: TextFieldProps['variant'];
  loading?: boolean;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  passwordToggle?: boolean;
  showCounter?: boolean;
};

export const AppTextField = forwardRef<HTMLDivElement, AppTextFieldProps>(
  function AppTextField(
    {
      size = 'small',
      fullWidth = true,
      variant = 'outlined',
      loading = false,
      startAdornment,
      endAdornment,
      passwordToggle = true,
      showCounter = false,
      type,
      error,
      helperText,
      id,
      value,
      slotProps,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const helperId = `${fieldId}-helper`;

    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const resolvedType = isPassword && showPassword ? 'text' : type;

    const maxLength = (slotProps?.htmlInput as { maxLength?: number } | undefined)
      ?.maxLength;
    const counter =
      showCounter && maxLength != null
        ? `${String(value ?? '').length}/${maxLength}`
        : null;

    const hasEnd =
      loading || (isPassword && passwordToggle) || Boolean(endAdornment);

    return (
      <TextField
        {...rest}
        ref={ref}
        id={fieldId}
        type={resolvedType}
        value={value}
        size={size}
        fullWidth={fullWidth}
        variant={variant}
        error={error}
        helperText={
          counter ? (
            <span style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{helperText}</span>
              <span>{counter}</span>
            </span>
          ) : (
            helperText
          )
        }
        slotProps={{
          ...slotProps,
          htmlInput: {
            'aria-describedby': helperText ? helperId : undefined,
            ...slotProps?.htmlInput,
          },
          formHelperText: {
            id: helperId,
            component: 'div',
            ...slotProps?.formHelperText,
          },
          input: {
            ...(slotProps?.input as object),
            startAdornment: startAdornment ? (
              <InputAdornment position="start">{startAdornment}</InputAdornment>
            ) : undefined,
            endAdornment: hasEnd ? (
              <InputAdornment position="end">
                {loading && <CircularProgress size={16} />}
                {isPassword && passwordToggle && (
                  <IconButton
                    size="small"
                    edge="end"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((s) => !s)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )}
                {endAdornment}
              </InputAdornment>
            ) : undefined,
          },
        }}
      />
    );
  },
);
