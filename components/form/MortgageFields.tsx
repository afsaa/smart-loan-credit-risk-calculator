import { PROPERTY_ADDRESS_MAX_LENGTH } from '@/lib/validation/limits';
import type { FieldGroupProps } from '@/components/form/field-props';
import { InputField } from '@/components/form/InputField';

export function MortgageFields({ values, errors }: FieldGroupProps) {
  return (
    <>
      <InputField
        name="propertyAddress"
        label="Property address"
        type="text"
        autoComplete="street-address"
        maxLength={PROPERTY_ADDRESS_MAX_LENGTH}
        defaultValue={values.propertyAddress}
        errors={errors.propertyAddress}
      />
      <InputField
        name="downPayment"
        label="Down payment ($)"
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        defaultValue={values.downPayment}
        errors={errors.downPayment}
      />
    </>
  );
}
