import type { LoanType, RiskLevel } from '@/types/loan';

/** Illustrative base APRs in basis points (integers avoid floating-point drift when adding). */
export const BASE_APR_BPS = {
  mortgage: 650,
  personal: 1150,
  auto: 750,
} as const satisfies Record<LoanType, number>;

export const RISK_ADJUSTMENT_BPS = {
  low: 0,
  medium: 150,
  high: 400,
} as const satisfies Record<RiskLevel, number>;

/**
 * Annual rate as a decimal (`0.065`). Without a risk level this is the base (best-tier) rate quoted
 * before the credit assessment completes.
 */
export function annualRateFor(loanType: LoanType, riskLevel?: RiskLevel): number {
  const adjustment = riskLevel === undefined ? 0 : RISK_ADJUSTMENT_BPS[riskLevel];
  return (BASE_APR_BPS[loanType] + adjustment) / 10_000;
}
