import { Control, Controller, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { AppMultiSelect, AppMultiSelectProps, AppSearchMultiSelect, AppSearchMultiSelectProps, AppSearchSelect, AppSearchSelectProps, AppSelect, AppSelectProps, NativeStyleBase, SearchBase, SelectValue } from "../fields/select-field";

type FormSelectCommon<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  name: TName;
  control: Control<TFieldValues>;
  rules?: Omit<
    RegisterOptions<TFieldValues, TName>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  searchable?: boolean;
};

export type FormSelectFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = FormSelectCommon<TFieldValues, TName> &
  Omit<NativeStyleBase<SelectValue>, 'name' | 'error'> &
  Pick<SearchBase<SelectValue>, 'loading' | 'onSearchChange'> & {
    multiple?: boolean;
    clearable?: boolean;
    maxChips?: number;
    limitTags?: number;
  };

export function FormSelectField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  searchable = false,
  multiple = false,
  helperText,
  required,
  onBlur,
  ...props
}: FormSelectFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const shared = {
          ...props,
          name: field.name,
          inputRef: field.ref,
          error: Boolean(fieldState.error),
          helperText: fieldState.error?.message ?? helperText,
          required: required ?? Boolean(rules?.required),
          onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            field.onBlur();
            onBlur?.(e);
          },
        };

        if (multiple) {
          const value: SelectValue[] = Array.isArray(field.value)
            ? field.value
            : [];

          if (searchable) {
            return (
              <AppSearchMultiSelect
                {...(shared as unknown as AppSearchMultiSelectProps)}
                value={value}
                onChange={field.onChange}
              />
            );
          }
          return (
            <AppMultiSelect
              {...(shared as unknown as AppMultiSelectProps)}
              value={value}
              onChange={field.onChange}
            />
          );
        }

        const value: SelectValue | null = field.value ?? null;

        if (searchable) {
          return (
            <AppSearchSelect
              {...(shared as unknown as AppSearchSelectProps)}
              value={value}
              onChange={field.onChange}
            />
          );
        }
        return (
          <AppSelect
            {...(shared as unknown as AppSelectProps)}
            value={value}
            onChange={field.onChange}
          />
        );
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Usage                                                                     */
/* -------------------------------------------------------------------------- */
/*
const roles: SelectOption<string>[] = [
  { value: 'admin', label: 'Admin', description: 'Full access' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer', disabled: true },
];

// Plain controlled usage
<AppSelect label="Role" options={roles} value={role} onChange={setRole} placeholder="Choose a role" clearable name="role" />
<AppMultiSelect label="Roles" options={roles} value={roleList} onChange={setRoleList} name="roles" />
<AppSearchSelect label="Role" options={roles} value={role} onChange={setRole} name="role" />
<AppSearchMultiSelect label="Roles" options={roles} value={roleList} onChange={setRoleList} name="roles" />

// With react-hook-form
<FormSelectField control={control} name="role" label="Role" options={roles}
  rules={{ required: 'Choose a role' }} />

<FormSelectField control={control} name="roles" label="Roles" options={roles}
  multiple searchable rules={{ validate: (v) => v.length > 0 || 'Choose at least one role' }} />

// Server-side search
<FormSelectField control={control} name="userId" label="User" options={users}
  searchable loading={isFetching} onSearchChange={setQuery} />
*/