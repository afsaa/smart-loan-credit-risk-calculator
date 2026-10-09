import { EMPLOYMENT_STATUSES, LOAN_TYPES } from '@/types/loan';
import type { EmploymentStatus, LoanType } from '@/types/loan';

// Zod-free so client components can narrow select values without bundling the schema.

export function isLoanType(value: unknown): value is LoanType {
  return LOAN_TYPES.some((loanType) => loanType === value);
}

export function isEmploymentStatus(value: unknown): value is EmploymentStatus {
  return EMPLOYMENT_STATUSES.some((status) => status === value);
}
