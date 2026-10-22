import type { ComponentPropsWithoutRef } from 'react';
import type { LoanFieldName } from '@/types/loan';
import { FieldError } from '@/components/form/FieldError';
import {
  errorIdFor,
  FIELD_CONTROL_CLASS_NAME,
  FIELD_LABEL_CLASS_NAME,
  fieldControlProps,
} from '@/components/form/field-props';

type NativeInputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'id' | 'name' | 'className' | 'aria-invalid' | 'aria-describedby'
>;

interface InputFieldProps extends NativeInputProps {
  name: LoanFieldName;
  label: string;
  errors: readonly string[] | undefined;
}

export function InputField({ name, label, errors, ...inputProps }: InputFieldProps) {
  const controlProps = fieldControlProps(name, errors);

  return (
    <div>
      <label htmlFor={controlProps.id} className={FIELD_LABEL_CLASS_NAME}>
        {label}
      </label>
      <input {...inputProps} {...controlProps} className={FIELD_CONTROL_CLASS_NAME} />
      <FieldError id={errorIdFor(name)} errors={errors} />
    </div>
  );
}
