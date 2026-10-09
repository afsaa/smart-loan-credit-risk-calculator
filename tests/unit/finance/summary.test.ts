import { describe, expect, it } from 'vitest';
import { fromCents, toCents } from '@/lib/finance/money';
import { annualRateFor } from '@/lib/finance/rates';
import { computeRepaymentSummary, debtToIncomeRatio, loanPrincipal } from '@/lib/finance/summary';
import {
  autoApplication,
  mortgageApplication,
  personalApplication,
} from '@/tests/unit/fixtures/loan-applications';

describe('money', () => {
  it('converts between dollars and integer cents', () => {
    expect(toCents(1580.1667)).toBe(158017);
    expect(fromCents(158017)).toBe(1580.17);
  });
});

describe('annualRateFor', () => {
  it('returns the base rate per loan type without a risk level', () => {
    expect(annualRateFor('mortgage')).toBe(0.065);
    expect(annualRateFor('personal')).toBe(0.115);
    expect(annualRateFor('auto')).toBe(0.075);
  });

  it('adds the risk adjustment without floating-point drift', () => {
    expect(annualRateFor('mortgage', 'low')).toBe(0.065);
    expect(annualRateFor('mortgage', 'medium')).toBe(0.08);
    expect(annualRateFor('auto', 'high')).toBe(0.115);
  });
});

describe('loanPrincipal', () => {
  it('subtracts the down payment for mortgages only', () => {
    expect(loanPrincipal(mortgageApplication({ loanAmount: 300_000, downPayment: 60_000 }))).toBe(
      240_000,
    );
    expect(loanPrincipal(personalApplication({ loanAmount: 30_000 }))).toBe(30_000);
    expect(loanPrincipal(autoApplication({ loanAmount: 25_000 }))).toBe(25_000);
  });
});

describe('debtToIncomeRatio', () => {
  it('includes the new payment', () => {
    expect(debtToIncomeRatio(500, 60_000, 1_000)).toBeCloseTo(0.3, 10);
  });

  it('rejects non-positive income', () => {
    expect(() => debtToIncomeRatio(500, 0, 1_000)).toThrow(RangeError);
  });
});

describe('computeRepaymentSummary', () => {
  it('summarises a mortgage on the financed principal', () => {
    const summary = computeRepaymentSummary(
      mortgageApplication({
        loanAmount: 300_000,
        downPayment: 50_000,
        termMonths: 360,
        annualIncome: 120_000,
        monthlyDebt: 400,
      }),
    );

    expect(summary).toMatchObject({
      loanType: 'mortgage',
      principal: 250_000,
      annualRate: 0.065,
      termMonths: 360,
      monthlyPayment: 1580.17,
    });
    expect(toCents(summary.totalCost)).toBe(toCents(summary.principal + summary.totalInterest));
    expect(summary.totalInterest).toBeCloseTo(1580.17 * 360 - 250_000, -1);
    expect(summary.debtToIncome).toBeCloseTo((400 + 1580.17) / 10_000, 10);
    expect(summary.yearlySchedule).toHaveLength(30);
    expect(summary.yearlySchedule.at(-1)?.balance).toBe(0);
  });

  it('applies the risk-adjusted rate when a risk level is given', () => {
    const base = computeRepaymentSummary(personalApplication());
    const high = computeRepaymentSummary(personalApplication(), { riskLevel: 'high' });

    expect(high.annualRate).toBe(0.155);
    expect(high.monthlyPayment).toBeGreaterThan(base.monthlyPayment);
  });
});
