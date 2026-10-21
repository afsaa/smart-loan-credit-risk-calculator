import type { EmploymentStatus, LoanPurpose, LoanType } from '@/types/loan';

export const LOAN_TYPE_LABELS = {
  mortgage: 'Mortgage',
  personal: 'Personal',
  auto: 'Auto',
} as const satisfies Record<LoanType, string>;

export const EMPLOYMENT_STATUS_LABELS = {
  employed: 'Employed',
  self_employed: 'Self-employed',
  unemployed: 'Unemployed',
} as const satisfies Record<EmploymentStatus, string>;

export const LOAN_PURPOSE_LABELS = {
  debt_consolidation: 'Debt consolidation',
  home_improvement: 'Home improvement',
  medical: 'Medical',
  education: 'Education',
  other: 'Other',
} as const satisfies Record<LoanPurpose, string>;
