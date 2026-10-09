import type { LoanApplication, RepaymentSummary, RiskLevel } from '@/types/loan';
import { assertNever } from '@/lib/utils/assert-never';
import { buildSchedule } from '@/lib/finance/amortization';
import { fromCents, toCents } from '@/lib/finance/money';
import { annualRateFor } from '@/lib/finance/rates';

export interface RepaymentSummaryOptions {
  riskLevel?: RiskLevel;
}

/** Amount actually borrowed: a mortgage finances the loan amount minus the down payment. */
export function loanPrincipal(application: LoanApplication): number {
  switch (application.loanType) {
    case 'mortgage':
      return application.loanAmount - application.downPayment;
    case 'personal':
    case 'auto':
      return application.loanAmount;
    default:
      return assertNever(application);
  }
}

/** (existing monthly debt + new monthly payment) / gross monthly income. */
export function debtToIncomeRatio(
  monthlyDebt: number,
  annualIncome: number,
  newMonthlyPayment: number,
): number {
  if (!Number.isFinite(annualIncome) || annualIncome <= 0) {
    throw new RangeError(
      `annualIncome must be a positive finite number, got ${String(annualIncome)}`,
    );
  }
  return (monthlyDebt + newMonthlyPayment) / (annualIncome / 12);
}

export function computeRepaymentSummary(
  application: LoanApplication,
  options: RepaymentSummaryOptions = {},
): RepaymentSummary {
  const principal = loanPrincipal(application);
  const annualRate = annualRateFor(application.loanType, options.riskLevel);
  const monthlyRows = buildSchedule(principal, annualRate, application.termMonths);
  const yearlySchedule = buildSchedule(principal, annualRate, application.termMonths, {
    granularity: 'yearly',
  });

  const totalInterestCents = monthlyRows.reduce((sum, row) => sum + toCents(row.interest), 0);
  const totalCostCents = monthlyRows.reduce((sum, row) => sum + toCents(row.payment), 0);
  const monthlyPayment = monthlyRows[0]?.payment ?? 0;

  return {
    loanType: application.loanType,
    principal,
    annualRate,
    termMonths: application.termMonths,
    monthlyPayment,
    totalInterest: fromCents(totalInterestCents),
    totalCost: fromCents(totalCostCents),
    debtToIncome: debtToIncomeRatio(
      application.monthlyDebt,
      application.annualIncome,
      monthlyPayment,
    ),
    yearlySchedule,
  };
}
