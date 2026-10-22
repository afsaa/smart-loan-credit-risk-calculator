import { VIN_LENGTH } from '@/lib/validation/limits';
import type { FieldGroupProps } from '@/components/form/field-props';
import { InputField } from '@/components/form/InputField';

export function AutoFields({ values, errors }: FieldGroupProps) {
  return (
    <InputField
      name="vehicleVin"
      label="Vehicle VIN"
      type="text"
      autoCapitalize="characters"
      autoComplete="off"
      spellCheck={false}
      maxLength={VIN_LENGTH}
      defaultValue={values.vehicleVin}
      errors={errors.vehicleVin}
    />
  );
}
