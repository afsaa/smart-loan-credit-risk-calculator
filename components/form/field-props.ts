import type { FieldErrors, LoanFieldName, SubmittedValues } from '@/types/loan';

/** Props shared by every group of form fields. */
export interface FieldGroupProps {
  values: SubmittedValues;
  errors: FieldErrors;
}

export const FIELD_LABEL_CLASS_NAME = 'mb-2 block text-sm font-medium text-gray-700';

export const FIELD_CONTROL_CLASS_NAME =
  'w-full rounded-lg border border-gray-500 p-2 focus:border-2 focus:outline-none aria-[invalid=true]:border-red-600';

export function fieldIdFor(name: LoanFieldName): string {
  return `field-${name}`;
}

export function errorIdFor(name: LoanFieldName): string {
  return `field-${name}-error`;
}

/** `id`, `name` and the ARIA wiring that links a control to its `FieldError`. */
export function fieldControlProps(name: LoanFieldName, errors: readonly string[] | undefined) {
  const invalid = errors !== undefined && errors.length > 0;
  return {
    id: fieldIdFor(name),
    name,
    'aria-invalid': invalid,
    'aria-describedby': invalid ? errorIdFor(name) : undefined,
  };
}
