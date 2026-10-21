import { Control, Controller, FieldPath, FieldValues, RegisterOptions } from "react-hook-form";
import { AppDateFieldBaseProps, AppDatePicker, AppDateTimePicker } from "../fields/date-field";
import dayjs from "dayjs";

export type FormDateFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<
  AppDateFieldBaseProps,
  'name' | 'value' | 'onChange' | 'error'
> & {
  name: TName;
  control: Control<TFieldValues>;
  rules?: Omit<
    RegisterOptions<TFieldValues, TName>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  withTime?: boolean;
  ampm?: boolean;
  minutesStep?: number;
};

export function FormDateField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  withTime = false,
  helperText,
  required,
  onBlur,
  ...props
}: FormDateFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const value = field.value ? dayjs(field.value) : null;

        const shared = {
          ...props,
          name: field.name,
          inputRef: field.ref,
          value,
          onChange: field.onChange,
          error: Boolean(fieldState.error),
          helperText: fieldState.error?.message ?? helperText,
          required: required ?? Boolean(rules?.required),
          onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
            field.onBlur();
            onBlur?.(e);
          },
        };

        return withTime ? (
          <AppDateTimePicker {...shared} />
        ) : (
          <AppDatePicker {...shared} />
        );
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Usage                                                                     */
/* -------------------------------------------------------------------------- */
/*
// 1. Wrap the app once (e.g. in your root layout / providers file)
<AppDateProvider>{children}</AppDateProvider>

// 2. Controlled usage
const [date, setDate] = useState<Dayjs | null>(null);

<AppDatePicker label="Start date" value={date} onChange={setDate} clearable disablePast />
<AppDateTimePicker label="Meeting" value={date} onChange={setDate} ampm={false} minutesStep={15} />

// 3. With react-hook-form (defaultValues should be null, not undefined)
const { control } = useForm({ defaultValues: { startDate: null, meetingAt: null } });

<FormDateField control={control} name="startDate" label="Start date"
  rules={{ required: 'Choose a start date' }} />

<FormDateField control={control} name="meetingAt" label="Meeting" withTime
  disablePast rules={{ required: 'Choose a date and time' }} />

// 4. On submit the values are Dayjs objects:
//    values.startDate?.format('YYYY-MM-DD')   values.meetingAt?.toISOString()
*/