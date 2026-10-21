import { LOAN_PURPOSES } from '@/types/loan';
import type { FieldGroupProps } from '@/components/form/field-props';
import { SelectField } from '@/components/form/SelectField';
import { LOAN_PURPOSE_LABELS } from '@/components/form/labels';

export function PersonalFields({ values, errors }: FieldGroupProps) {
  return (
    <SelectField
      name="loanPurpose"
      label="Loan purpose"
      options={LOAN_PURPOSES}
      optionLabels={LOAN_PURPOSE_LABELS}
      defaultValue={values.loanPurpose}
      errors={errors.loanPurpose}
    />
  );
}
