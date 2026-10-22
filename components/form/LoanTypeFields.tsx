import type { ReactNode } from 'react';
import type { LoanType } from '@/types/loan';
import { assertNever } from '@/lib/utils/assert-never';
import { TERM_MONTHS_RANGE } from '@/lib/validation/limits';
import type { FieldGroupProps } from '@/components/form/field-props';
import { AutoFields } from '@/components/form/AutoFields';
import { InputField } from '@/components/form/InputField';
import { MortgageFields } from '@/components/form/MortgageFields';
import { PersonalFields } from '@/components/form/PersonalFields';

interface LoanTypeFieldsProps extends FieldGroupProps {
  loanType: LoanType;
}

function variantFieldsFor({ loanType, values, errors }: LoanTypeFieldsProps): ReactNode {
  switch (loanType) {
    case 'mortgage':
      return <MortgageFields values={values} errors={errors} />;
    case 'personal':
      return <PersonalFields values={values} errors={errors} />;
    case 'auto':
      return <AutoFields values={values} errors={errors} />;
    default:
      return assertNever(loanType);
  }
}

/** Fields whose presence or limits depend on `loanType`; inactive variants are unmounted. */
export function LoanTypeFields({ loanType, values, errors }: LoanTypeFieldsProps) {
  const termRange = TERM_MONTHS_RANGE[loanType];

  return (
    <>
      <InputField
        name="termMonths"
        label="Loan term (months)"
        type="number"
        inputMode="numeric"
        min={termRange.min}
        max={termRange.max}
        step={1}
        defaultValue={values.termMonths}
        errors={errors.termMonths}
      />
      {variantFieldsFor({ loanType, values, errors })}
    </>
  );
}
