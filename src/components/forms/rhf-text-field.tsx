import { Control, Controller, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { AppTextField, AppTextFieldProps } from "../fields/text-field";

export type FormTextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<AppTextFieldProps, 'name' | 'value' | 'defaultValue' | 'error'> & {
  name: TName;
  control: Control<TFieldValues>;
  rules?: Omit<
    RegisterOptions<TFieldValues, TName>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  parse?: (raw: string) => unknown;
  format?: (value: unknown) => string;
};

export function FormTextField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  parse,
  format,
  helperText,
  required,
  onBlur,
  onChange,
  ...props
}: FormTextFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <AppTextField
          {...props}
          name={field.name}
          inputRef={field.ref}
          value={format ? format(field.value) : (field.value ?? '')}
          required={required ?? Boolean(rules?.required)}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
          onChange={(e) => {
            field.onChange(parse ? parse(e.target.value) : e.target.value);
            onChange?.(e);
          }}
          onBlur={(e) => {
            field.onBlur();
            onBlur?.(e);
          }}
        />
      )}
    />
  );
}
