import type { ScheduleRow } from '@/types/loan';
import { assertNever } from '@/lib/utils/assert-never';
import { fromCents, toCents } from '@/lib/finance/money';

export type ScheduleGranularity = 'monthly' | 'yearly';

export interface BuildScheduleOptions {
  granularity?: ScheduleGranularity;
}

function assertLoanTerms(principal: number, annualRate: number, termMonths: number): void {
  if (!Number.isFinite(principal) || principal <= 0) {
    throw new RangeError(`principal must be a positive finite number, got ${String(principal)}`);
  }
  if (!Number.isFinite(annualRate) || annualRate < 0) {
    throw new RangeError(`annualRate must be a finite number >= 0, got ${String(annualRate)}`);
  }
  if (!Number.isInteger(termMonths) || termMonths <= 0) {
    throw new RangeError(`termMonths must be a positive integer, got ${String(termMonths)}`);
  }
}

/**
 * Level monthly payment for a fully amortizing loan (unrounded). A 0% rate repays the principal in
 * equal instalments instead of dividing by zero.
 */
export function monthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  assertLoanTerms(principal, annualRate, termMonths);
  if (annualRate === 0) {
    return principal / termMonths;
  }
  const monthlyRate = annualRate / 12;
  const growth = (1 + monthlyRate) ** termMonths;
  return (principal * monthlyRate * growth) / (growth - 1);
}

function buildMonthlyCentRows(
  principal: number,
  annualRate: number,
  termMonths: number,
): ScheduleRow[] {
  const monthlyRate = annualRate / 12;
  const paymentCents = toCents(monthlyPayment(principal, annualRate, termMonths));
  const rows: ScheduleRow[] = [];
  let balance = toCents(principal);

  for (let period = 1; period <= termMonths; period += 1) {
    const interest = Math.round(balance * monthlyRate);
    const principalPart =
      period === termMonths ? balance : Math.min(Math.max(paymentCents - interest, 0), balance);
    balance -= principalPart;
    rows.push({
      period,
      payment: principalPart + interest,
      principal: principalPart,
      interest,
      balance,
    });
  }
  return rows;
}

function rollUpByYear(monthlyRows: readonly ScheduleRow[]): ScheduleRow[] {
  const years: ScheduleRow[] = [];
  for (const row of monthlyRows) {
    const period = Math.ceil(row.period / 12);
    const current = years.at(-1);
    if (current?.period === period) {
      current.payment += row.payment;
      current.principal += row.principal;
      current.interest += row.interest;
      current.balance = row.balance;
    } else {
      years.push({ ...row, period });
    }
  }
  return years;
}

function centRowToDollars(row: ScheduleRow): ScheduleRow {
  return {
    period: row.period,
    payment: fromCents(row.payment),
    principal: fromCents(row.principal),
    interest: fromCents(row.interest),
    balance: fromCents(row.balance),
  };
}

/**
 * Amortization schedule computed in integer cents: the regular payment and each month's interest
 * are rounded to the cent, and the final payment absorbs the rounding difference so the ending
 * balance is exactly 0 and the principal column sums to the principal (to the cent).
 */
export function buildSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  options: BuildScheduleOptions = {},
): ScheduleRow[] {
  const monthlyRows = buildMonthlyCentRows(principal, annualRate, termMonths);
  const granularity = options.granularity ?? 'monthly';
  switch (granularity) {
    case 'monthly':
      return monthlyRows.map(centRowToDollars);
    case 'yearly':
      return rollUpByYear(monthlyRows).map(centRowToDollars);
    default:
      return assertNever(granularity);
  }
}
