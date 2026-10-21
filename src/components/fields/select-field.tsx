'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import { AppTextField } from './text-field';
import type { AppTextFieldProps } from './text-field'; 

export type SelectValue = string | number;

export type SelectOption<V extends SelectValue = SelectValue> = {
  value: V;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type NativeStyleBase<V extends SelectValue> = Omit<
  AppTextFieldProps,
  | 'select'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'type'
  | 'multiline'
  | 'rows'
  | 'minRows'
  | 'maxRows'
  | 'passwordToggle'
  | 'showCounter'
> & {
  options: SelectOption<V>[];
  placeholder?: string;
  noOptionsText?: string;
};

export type SearchBase<V extends SelectValue> = Pick<
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
  | 'onBlur'
  | 'inputRef'
  | 'sx'
> & {
  options: SelectOption<V>[];
  loading?: boolean;
  noOptionsText?: string;
  onSearchChange?: (query: string) => void;
};

function OptionLabel<V extends SelectValue>({
  option,
}: {
  option: SelectOption<V>;
}) {
  return (
    <ListItemText
      primary={option.label}
      secondary={option.description}
      slotProps={{ primary: { noWrap: true } }}
      sx={{ m: 0 }}
    />
  );
}

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <Box component="span" sx={{ color: 'text.disabled' }}>
      {children}
    </Box>
  );
}

export type AppSelectProps<V extends SelectValue = SelectValue> =
  NativeStyleBase<V> & {
    value: V | null;
    onChange: (value: V | null) => void;
    clearable?: boolean;
  };

export function AppSelect<V extends SelectValue = SelectValue>({
  options,
  value,
  onChange,
  placeholder,
  noOptionsText = 'No options available',
  clearable = false,
  slotProps,
  ...rest
}: AppSelectProps<V>) {
  return (
    <AppTextField
      {...rest}
      select
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value as V | '';
        onChange(raw === '' ? null : raw);
      }}
      slotProps={{
        ...slotProps,
        select: {
          displayEmpty: Boolean(placeholder),
          renderValue: (selected) => {
            if (selected === '' || selected == null) {
              return <Placeholder>{placeholder}</Placeholder>;
            }
            return options.find((o) => o.value === selected)?.label ?? '';
          },
          ...slotProps?.select,
        },
      }}
    >
      {clearable && (
        <MenuItem value="">
          <Placeholder>{placeholder ?? 'None'}</Placeholder>
        </MenuItem>
      )}
      {options.length === 0 ? (
        <MenuItem disabled>{noOptionsText}</MenuItem>
      ) : (
        options.map((o) => (
          <MenuItem key={o.value} value={o.value} disabled={o.disabled}>
            <OptionLabel option={o} />
          </MenuItem>
        ))
      )}
    </AppTextField>
  );
}

export type AppMultiSelectProps<V extends SelectValue = SelectValue> =
  NativeStyleBase<V> & {
    value: V[];
    onChange: (value: V[]) => void;
    maxChips?: number;
  };

export function AppMultiSelect<V extends SelectValue = SelectValue>({
  options,
  value,
  onChange,
  placeholder,
  noOptionsText = 'No options available',
  maxChips = 3,
  slotProps,
  ...rest
}: AppMultiSelectProps<V>) {
  return (
    <AppTextField
      {...rest}
      select
      value={value}
      onChange={(e) => {
        const raw = e.target.value as unknown as V[] | string;
        onChange(typeof raw === 'string' ? (raw.split(',') as V[]) : raw);
      }}
      slotProps={{
        ...slotProps,
        select: {
          multiple: true,
          displayEmpty: Boolean(placeholder),
          renderValue: (selected) => {
            const items = selected as V[];
            if (items.length === 0) {
              return <Placeholder>{placeholder}</Placeholder>;
            }
            const shown = items.slice(0, maxChips);
            const hidden = items.length - shown.length;
            return (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {shown.map((v) => (
                  <Chip
                    key={v}
                    size="small"
                    label={options.find((o) => o.value === v)?.label ?? v}
                  />
                ))}
                {hidden > 0 && <Chip size="small" variant="outlined" label={`+${hidden}`} />}
              </Box>
            );
          },
          ...slotProps?.select,
        },
      }}
    >
      {options.length === 0 ? (
        <MenuItem disabled>{noOptionsText}</MenuItem>
      ) : (
        options.map((o) => (
          <MenuItem key={o.value} value={o.value} disabled={o.disabled}>
            <Checkbox
              size="small"
              checked={value.includes(o.value)}
              tabIndex={-1}
              disableRipple
              sx={{ mr: 1, p: 0.5 }}
            />
            <OptionLabel option={o} />
          </MenuItem>
        ))
      )}
    </AppTextField>
  );
}

function buildSearchInput(
  props: Pick<
    SearchBase<SelectValue>,
    | 'name'
    | 'id'
    | 'label'
    | 'placeholder'
    | 'helperText'
    | 'error'
    | 'required'
    | 'onBlur'
    | 'inputRef'
    | 'loading'
  >,
) {
  const { loading, ...field } = props;
  return function renderInput(params: AutocompleteRenderInputParams) {
    const { slotProps, ...rest } = params;
    return (
      <TextField
        {...rest}
        {...field}
        slotProps={{
          ...slotProps,
          input: {
            ...slotProps.input,
            endAdornment: (
              <>
                {loading && <CircularProgress size={16} sx={{ mr: 0.5 }} />}
                {slotProps.input.endAdornment}
              </>
            ),
          },
        }}
      />
    );
  };
}

export type AppSearchSelectProps<V extends SelectValue = SelectValue> =
  SearchBase<V> & {
    value: V | null;
    onChange: (value: V | null) => void;
  };

export function AppSearchSelect<V extends SelectValue = SelectValue>({
  options,
  value,
  onChange,
  loading = false,
  noOptionsText = 'No matches found',
  onSearchChange,
  size = 'small',
  fullWidth = true,
  disabled,
  sx,
  ...field
}: AppSearchSelectProps<V>) {
  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  return (
    <Autocomplete<SelectOption<V>, false, false, false>
      options={options}
      value={selected}
      onChange={(_, next) => onChange(next?.value ?? null)}
      onInputChange={(_, text, reason) => {
        if (reason === 'input' || reason === 'clear') onSearchChange?.(text);
      }}
      filterOptions={onSearchChange ? (x) => x : undefined}
      getOptionLabel={(o) => o.label}
      getOptionDisabled={(o) => Boolean(o.disabled)}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      loading={loading}
      loadingText="Loading…"
      noOptionsText={noOptionsText}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      sx={sx}
      autoHighlight
      handleHomeEndKeys
      renderOption={(props, option) => {
        const { key, ...optionProps } = props as typeof props & { key: string };
        return (
          <li key={key} {...optionProps}>
            <OptionLabel option={option} />
          </li>
        );
      }}
      renderInput={buildSearchInput({ ...field, loading })}
    />
  );
}

export type AppSearchMultiSelectProps<V extends SelectValue = SelectValue> =
  SearchBase<V> & {
    value: V[];
    onChange: (value: V[]) => void;
    limitTags?: number;
  };

export function AppSearchMultiSelect<V extends SelectValue = SelectValue>({
  options,
  value,
  onChange,
  loading = false,
  noOptionsText = 'No matches found',
  onSearchChange,
  limitTags = 3,
  size = 'small',
  fullWidth = true,
  disabled,
  sx,
  ...field
}: AppSearchMultiSelectProps<V>) {
  const selected = useMemo(() => {
    const byValue = new Map(options.map((o) => [o.value, o]));
    return value
      .map((v) => byValue.get(v))
      .filter((o): o is SelectOption<V> => Boolean(o));
  }, [options, value]);

  return (
    <Autocomplete<SelectOption<V>, true, false, false>
      multiple
      disableCloseOnSelect
      options={options}
      value={selected}
      onChange={(_, next) => onChange(next.map((o) => o.value))}
      onInputChange={(_, text, reason) => {
        if (reason === 'input' || reason === 'clear') onSearchChange?.(text);
      }}
      filterOptions={onSearchChange ? (x) => x : undefined}
      getOptionLabel={(o) => o.label}
      getOptionDisabled={(o) => Boolean(o.disabled)}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      limitTags={limitTags}
      loading={loading}
      loadingText="Loading…"
      noOptionsText={noOptionsText}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      sx={sx}
      autoHighlight
      renderOption={(props, option, { selected: isSelected }) => {
        const { key, ...optionProps } = props as typeof props & { key: string };
        return (
          <li key={key} {...optionProps}>
            <Checkbox
              size="small"
              checked={isSelected}
              tabIndex={-1}
              disableRipple
              sx={{ mr: 1, p: 0.5 }}
            />
            <OptionLabel option={option} />
          </li>
        );
      }}
      renderInput={buildSearchInput({ ...field, loading })}
    />
  );
}
