import { describe, expect, it } from 'vitest';
import { buildSchedule, monthlyPayment } from '@/lib/finance/amortization';
import { toCents } from '@/lib/finance/money';

function sumCents(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + toCents(value), 0);
}

describe('monthlyPayment', () => {
  it('matches the reference value for 250,000 @ 6.5% over 360 months', () => {
    expect(monthlyPayment(250_000, 0.065, 360)).toBeCloseTo(1580.17, 2);
  });

  it('splits the principal evenly at a 0% rate', () => {
    expect(monthlyPayment(12_000, 0, 12)).toBe(1_000);
  });

  it('repays principal plus one month of interest for a 1-month term', () => {
    expect(monthlyPayment(1_200, 0.12, 1)).toBeCloseTo(1_212, 10);
  });

  it.each([
    [0, 0.05, 12],
    [-1, 0.05, 12],
    [Number.NaN, 0.05, 12],
    [1_000, -0.01, 12],
    [1_000, Number.POSITIVE_INFINITY, 12],
    [1_000, 0.05, 0],
    [1_000, 0.05, 12.5],
  ])('rejects invalid terms (%s, %s, %s)', (principal, rate, term) => {
    expect(() => monthlyPayment(principal, rate, term)).toThrow(RangeError);
  });
});

describe('buildSchedule', () => {
  it.each([
    [250_000, 0.065, 360],
    [30_000, 0.115, 60],
    [12_345.67, 0.075, 37],
    [10_000, 0, 7],
  ])('amortizes %s @ %s over %s months to exactly 0', (principal, rate, term) => {
    const rows = buildSchedule(principal, rate, term);

    expect(rows).toHaveLength(term);
    expect(rows.at(-1)?.balance).toBe(0);
    expect(sumCents(rows.map((row) => row.principal))).toBe(toCents(principal));
    for (const row of rows) {
      expect(toCents(row.payment)).toBe(toCents(row.principal) + toCents(row.interest));
    }
  });

  it('uses the cent-rounded level payment for every row but the last', () => {
    const rows = buildSchedule(250_000, 0.065, 360);
    const regular = rows.slice(0, -1).map((row) => row.payment);
    expect(new Set(regular)).toEqual(new Set([1580.17]));
    expect(rows.at(-1)?.payment).toBeCloseTo(1580.17, 0);
  });

  it('rolls up by year with matching totals', () => {
    const monthly = buildSchedule(12_345.67, 0.075, 37);
    const yearly = buildSchedule(12_345.67, 0.075, 37, { granularity: 'yearly' });

    expect(yearly.map((row) => row.period)).toEqual([1, 2, 3, 4]);
    expect(yearly.at(-1)?.balance).toBe(0);
    expect(yearly[0]?.balance).toBe(monthly[11]?.balance);
    expect(sumCents(yearly.map((row) => row.interest))).toBe(
      sumCents(monthly.map((row) => row.interest)),
    );
    expect(sumCents(yearly.map((row) => row.payment))).toBe(
      sumCents(monthly.map((row) => row.payment)),
    );
  });
});
