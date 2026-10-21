import type { LoanType, SubmittedValues } from '@/types/loan';
import { isLoanType } from '@/lib/validation/guards';

const DEFAULT_LOAN_TYPE: LoanType = 'mortgage';

const DEFAULT_VALUES = {
  loanAmount: '250000',
  annualIncome: '75000',
  monthlyDebt: '500',
  creditScore: '700',
} as const satisfies SubmittedValues;

const DEFAULT_TERM_MONTHS = {
  mortgage: 360,
  personal: 60,
  auto: 60,
} as const satisfies Record<LoanType, number>;

export function initialLoanType(submitted: SubmittedValues): LoanType {
  return isLoanType(submitted.loanType) ? submitted.loanType : DEFAULT_LOAN_TYPE;
}

/**
 * Default values for the inputs of `loanType`: the last submission wins over the defaults, except
 * `termMonths`, whose valid range depends on the type it was submitted for.
 */
export function formValuesFor(loanType: LoanType, submitted: SubmittedValues): SubmittedValues {
  const submittedTerm = submitted.loanType === loanType ? submitted.termMonths : undefined;
  return {
    ...DEFAULT_VALUES,
    ...submitted,
    termMonths: submittedTerm ?? String(DEFAULT_TERM_MONTHS[loanType]),
  };
}
