'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import type { AppTextFieldProps } from './text-field';

export function AppDateProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale?: string;
}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
      {children}
    </LocalizationProvider>
  );
}

export type AppDateFieldBaseProps = Pick<
  AppTextFieldProps,
  | 'name'
  | 'id'
  | 'label'
  | 'placeholder'
  | 'helperText'
  | 'error'
  | 'required'
  | 'disabled'
  | 'size'
  | 'fullWidth'
  | 'inputRef'
  | 'sx'
> & {
  onBlur?: React.FocusEventHandler<HTMLDivElement>;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  readOnly?: boolean;
  clearable?: boolean;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  disablePast?: boolean;
  disableFuture?: boolean;
  shouldDisableDate?: (date: Dayjs) => boolean;
  format?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  invalidDate: 'Enter a valid date',
  minDate: 'Date is too early',
  maxDate: 'Date is too late',
  minTime: 'Time is too early',
  maxTime: 'Time is too late',
  minutesStep: 'Choose a valid minute step',
  disablePast: 'Date cannot be in the past',
  disableFuture: 'Date cannot be in the future',
  shouldDisableDate: 'This date is not available',
  shouldDisableMonth: 'This month is not available',
  shouldDisableYear: 'This year is not available',
  shouldDisableTime: 'This time is not available',
};

function useSharedPickerProps({
  size = 'small',
  fullWidth = true,
  name,
  id,
  placeholder,
  helperText,
  error,
  required,
  onBlur,
  sx,
  clearable = false,
  inputRef,
  ...pickerProps
}: Omit<AppDateFieldBaseProps, 'label'>) {
  const [reason, setReason] = useState<string | null>(null);

  const internalMessage = reason
    ? (ERROR_MESSAGES[reason] ?? 'Invalid value')
    : undefined;
  const hasError = Boolean(error) || Boolean(internalMessage);

  return {
    ...pickerProps,
    inputRef,
    onError: (next: string | null) => setReason(next),
    slotProps: {
      field: { clearable },
      textField: {
        name,
        id,
        size,
        fullWidth,
        placeholder,
        required,
        onBlur,
        sx,
        error: hasError,
        helperText: error ? helperText : (internalMessage ?? helperText),
      },
    },
  };
}

export type AppDatePickerProps = AppDateFieldBaseProps;

export function AppDatePicker({
  label,
  format = 'DD/MM/YYYY',
  ...props
}: AppDatePickerProps) {
  const shared = useSharedPickerProps(props);
  return <DatePicker {...shared} label={label} format={format} />;
}

export type AppDateTimePickerProps = AppDateFieldBaseProps & {
  ampm?: boolean;
  minutesStep?: number;
};

export function AppDateTimePicker({
  label,
  ampm = true,
  minutesStep = 1,
  format,
  ...props
}: AppDateTimePickerProps) {
  const shared = useSharedPickerProps(props);
  return (
    <DateTimePicker
      {...shared}
      label={label}
      ampm={ampm}
      minutesStep={minutesStep}
      format={format ?? (ampm ? 'DD/MM/YYYY hh:mm A' : 'DD/MM/YYYY HH:mm')}
    />
  );
}
