import type { ComponentPropsWithoutRef } from 'react';
import type { LoanFieldName } from '@/types/loan';
import { FieldError } from '@/components/form/FieldError';
import {
  errorIdFor,
  FIELD_CONTROL_CLASS_NAME,
  FIELD_LABEL_CLASS_NAME,
  fieldControlProps,
} from '@/components/form/field-props';

type NativeSelectProps = Omit<
  ComponentPropsWithoutRef<'select'>,
  'id' | 'name' | 'className' | 'children' | 'aria-invalid' | 'aria-describedby'
>;

interface SelectFieldProps<T extends string> extends NativeSelectProps {
  name: LoanFieldName;
  label: string;
  options: readonly T[];
  optionLabels: Record<T, string>;
  errors: readonly string[] | undefined;
}

export function SelectField<T extends string>({
  name,
  label,
  options,
  optionLabels,
  errors,
  ...selectProps
}: SelectFieldProps<T>) {
  const controlProps = fieldControlProps(name, errors);

  return (
    <div>
      <label htmlFor={controlProps.id} className={FIELD_LABEL_CLASS_NAME}>
        {label}
      </label>
      <select {...selectProps} {...controlProps} className={FIELD_CONTROL_CLASS_NAME}>
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels[option]}
          </option>
        ))}
      </select>
      <FieldError id={errorIdFor(name)} errors={errors} />
    </div>
  );
}
