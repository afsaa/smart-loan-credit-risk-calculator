import { describe, expect, it } from 'vitest';
import type { LoanApplication } from '@/types/loan';
import {
  RISK_THRESHOLDS,
  decodeVinModelYear,
  riskLevelForScore,
  scoreApplication,
} from '@/lib/credit/scoring';
import {
  autoApplication,
  mortgageApplication,
  personalApplication,
  vin,
} from '@/tests/unit/fixtures/loan-applications';

const options = { referenceYear: 2026 };

function score(application: LoanApplication): number {
  return scoreApplication(application, options).score;
}

describe('riskLevelForScore', () => {
  it('maps scores to levels at the threshold boundaries', () => {
    expect(riskLevelForScore(0)).toBe('low');
    expect(riskLevelForScore(RISK_THRESHOLDS.medium - 1)).toBe('low');
    expect(riskLevelForScore(RISK_THRESHOLDS.medium)).toBe('medium');
    expect(riskLevelForScore(RISK_THRESHOLDS.high - 1)).toBe('medium');
    expect(riskLevelForScore(RISK_THRESHOLDS.high)).toBe('high');
    expect(riskLevelForScore(100)).toBe('high');
  });
});

describe('decodeVinModelYear', () => {
  it.each([
    ['1HGCM82633A004352', 2003],
    ['1HGCM8263AA004352', 2010],
    ['1HGCM8263TA004352', 2026],
    ['1HGCM8263VA004352', 2027],
    ['1HGCM8263WA004352', 1998],
  ])('decodes %s as %i relative to 2026', (value, year) => {
    expect(decodeVinModelYear(vin(value), 2026)).toBe(year);
  });

  it.each(['1HGCM82630A004352', '1HGCM8263UA004352', '1HGCM8263ZA004352'])(
    'returns null for the non-year code in %s',
    (value) => {
      expect(decodeVinModelYear(vin(value), 2026)).toBeNull();
    },
  );
});

describe('scoreApplication', () => {
  it('returns a 0-100 score, a matching level and one factor per dimension', () => {
    const result = scoreApplication(personalApplication(), options);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.level).toBe(riskLevelForScore(result.score));
    expect(result.factors.map((factor) => factor.id)).toEqual([
      'credit_score',
      'debt_to_income',
      'employment',
      'loan_purpose',
    ]);
  });

  it('is monotonic in credit score (better score, lower risk)', () => {
    const scores = [300, 500, 650, 720, 800, 850].map((creditScore) =>
      score(personalApplication({ creditScore })),
    );
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(scores[0]).toBeGreaterThan(scores.at(-1) ?? Number.POSITIVE_INFINITY);
  });

  it('rates a strong profile low and a weak profile high', () => {
    expect(scoreApplication(mortgageApplication(), options).level).toBe('low');
    expect(
      scoreApplication(
        personalApplication({
          creditScore: 520,
          employmentStatus: 'unemployed',
          monthlyDebt: 2_000,
          annualIncome: 40_000,
          loanPurpose: 'other',
        }),
        options,
      ).level,
    ).toBe('high');
  });

  it('penalises a high loan-to-value mortgage', () => {
    const lowLtv = mortgageApplication({ loanAmount: 300_000, downPayment: 90_000 });
    const highLtv = mortgageApplication({ loanAmount: 300_000, downPayment: 0 });
    const factor = scoreApplication(highLtv, options).factors.find(
      (item) => item.id === 'loan_to_value',
    );

    expect(factor).toMatchObject({ description: 'Loan-to-value ratio of 100%', impact: 10 });
    expect(score(highLtv)).toBeGreaterThan(score(lowLtv));
  });

  it('weights personal loans by purpose', () => {
    expect(score(personalApplication({ loanPurpose: 'other' }))).toBeGreaterThan(
      score(personalApplication({ loanPurpose: 'home_improvement' })),
    );
  });

  it('penalises older vehicles using the VIN model year', () => {
    const newCar = autoApplication({ vehicleVin: vin('1HGCM8263TA004352') });
    const oldCar = autoApplication({ vehicleVin: vin('1HGCM82633A004352') });
    const factor = scoreApplication(oldCar, options).factors.find(
      (item) => item.id === 'vehicle_age',
    );

    expect(factor).toMatchObject({ description: 'Vehicle model year 2003 (23 years old)' });
    expect(score(oldCar)).toBeGreaterThan(score(newCar));
  });

  it('uses a neutral penalty when the model year cannot be decoded', () => {
    const factor = scoreApplication(
      autoApplication({ vehicleVin: vin('1HGCM8263ZA004352') }),
      options,
    ).factors.find((item) => item.id === 'vehicle_age');
    expect(factor?.impact).toBe(5);
  });

  it('penalises weaker employment', () => {
    expect(score(personalApplication({ employmentStatus: 'unemployed' }))).toBeGreaterThan(
      score(personalApplication({ employmentStatus: 'self_employed' })),
    );
  });
});
