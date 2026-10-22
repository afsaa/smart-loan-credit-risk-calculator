import type { LoanType } from '@/types/loan';

// Zod-free so form inputs can mirror the schema limits without bundling the schema.

export interface Range {
  min: number;
  max: number;
}

export const LOAN_AMOUNT_RANGE = { min: 1_000, max: 5_000_000 } as const satisfies Range;
export const CREDIT_SCORE_RANGE = { min: 300, max: 850 } as const satisfies Range;
export const TERM_MONTHS_RANGE = {
  mortgage: { min: 120, max: 480 },
  personal: { min: 12, max: 84 },
  auto: { min: 12, max: 96 },
} as const satisfies Record<LoanType, Range>;
export const PROPERTY_ADDRESS_MAX_LENGTH = 200;
export const VIN_LENGTH = 17;
