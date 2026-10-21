import { EMPLOYMENT_STATUSES } from '@/types/loan';
import { CREDIT_SCORE_RANGE, LOAN_AMOUNT_RANGE } from '@/lib/validation/limits';
import type { FieldGroupProps } from '@/components/form/field-props';
import { InputField } from '@/components/form/InputField';
import { SelectField } from '@/components/form/SelectField';
import { EMPLOYMENT_STATUS_LABELS } from '@/components/form/labels';

export function CommonFields({ values, errors }: FieldGroupProps) {
  return (
    <>
      <InputField
        name="loanAmount"
        label="Loan amount ($)"
        type="number"
        inputMode="decimal"
        min={LOAN_AMOUNT_RANGE.min}
        max={LOAN_AMOUNT_RANGE.max}
        step="any"
        defaultValue={values.loanAmount}
        errors={errors.loanAmount}
      />
      <InputField
        name="annualIncome"
        label="Annual income ($)"
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        defaultValue={values.annualIncome}
        errors={errors.annualIncome}
      />
      <InputField
        name="monthlyDebt"
        label="Existing monthly debt payments ($)"
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        defaultValue={values.monthlyDebt}
        errors={errors.monthlyDebt}
      />
      <InputField
        name="creditScore"
        label="Credit score"
        type="number"
        inputMode="numeric"
        min={CREDIT_SCORE_RANGE.min}
        max={CREDIT_SCORE_RANGE.max}
        step={1}
        defaultValue={values.creditScore}
        errors={errors.creditScore}
      />
      <SelectField
        name="employmentStatus"
        label="Employment status"
        options={EMPLOYMENT_STATUSES}
        optionLabels={EMPLOYMENT_STATUS_LABELS}
        defaultValue={values.employmentStatus}
        errors={errors.employmentStatus}
      />
    </>
  );
}
