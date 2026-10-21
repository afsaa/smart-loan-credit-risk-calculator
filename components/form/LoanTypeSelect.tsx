import { LOAN_TYPES, type LoanType } from '@/types/loan';
import { isLoanType } from '@/lib/validation/guards';
import { SelectField } from '@/components/form/SelectField';
import { LOAN_TYPE_LABELS } from '@/components/form/labels';

interface LoanTypeSelectProps {
  value: LoanType;
  onLoanTypeChange: (loanType: LoanType) => void;
  errors: readonly string[] | undefined;
}

export function LoanTypeSelect({ value, onLoanTypeChange, errors }: LoanTypeSelectProps) {
  return (
    <SelectField
      name="loanType"
      label="Loan type"
      options={LOAN_TYPES}
      optionLabels={LOAN_TYPE_LABELS}
      errors={errors}
      value={value}
      onChange={(event) => {
        const selected = event.target.value;
        if (isLoanType(selected)) {
          onLoanTypeChange(selected);
        }
      }}
    />
  );
}
