import { describe, expect, it } from 'vitest';
import { isEmploymentStatus, isLoanType } from '@/lib/validation/guards';
import {
  isLoanFieldName,
  loanApplicationSchema,
  loanFieldsFor,
} from '@/lib/validation/loan-schema';
import { isVin, normalizeVin, toVin } from '@/lib/validation/vin';
import { VALID_VIN } from '@/tests/unit/fixtures/loan-applications';

const base = {
  loanAmount: 30_000,
  annualIncome: 90_000,
  monthlyDebt: 0,
  creditScore: 720,
  employmentStatus: 'employed',
};

describe('vin', () => {
  it('normalises case and surrounding whitespace', () => {
    expect(normalizeVin('  1hgcm82633a004352 ')).toBe(VALID_VIN);
    expect(toVin(' 1hgcm82633a004352 ')).toBe(VALID_VIN);
  });

  it.each([
    ['too short', '1HGCM82633A00435'],
    ['too long', '1HGCM82633A0043521'],
    ['contains I', '1HGCM82633I004352'],
    ['contains O', '1HGCM82633O004352'],
    ['contains Q', '1HGCM82633Q004352'],
    ['inner whitespace', '1HGCM826 3A004352'],
  ])('rejects a VIN that is %s', (_, value) => {
    expect(toVin(value)).toBeNull();
    expect(isVin(value)).toBe(false);
  });
});

describe('guards', () => {
  it('isLoanType accepts only the lowercase loan types', () => {
    expect(['mortgage', 'personal', 'auto'].every(isLoanType)).toBe(true);
    expect(['Mortgage', 'student', '', undefined, 1].some(isLoanType)).toBe(false);
  });

  it('isEmploymentStatus accepts only the known statuses', () => {
    expect(['employed', 'self_employed', 'unemployed'].every(isEmploymentStatus)).toBe(true);
    expect(['Employed', 'self-employed', null].some(isEmploymentStatus)).toBe(false);
  });

  it('isLoanFieldName accepts only known field names', () => {
    expect(isLoanFieldName('vehicleVin')).toBe(true);
    expect(isLoanFieldName('ssn')).toBe(false);
  });

  it('loanFieldsFor lists exactly the variant fields', () => {
    const common = [
      'loanType',
      'loanAmount',
      'annualIncome',
      'monthlyDebt',
      'creditScore',
      'employmentStatus',
      'termMonths',
    ];
    expect([...loanFieldsFor('mortgage')].sort()).toEqual(
      [...common, 'propertyAddress', 'downPayment'].sort(),
    );
    expect([...loanFieldsFor('personal')].sort()).toEqual([...common, 'loanPurpose'].sort());
    expect([...loanFieldsFor('auto')].sort()).toEqual([...common, 'vehicleVin'].sort());
  });
});

describe('loanApplicationSchema', () => {
  it('parses each variant and strips foreign fields', () => {
    expect(
      loanApplicationSchema.parse({
        ...base,
        loanType: 'auto',
        termMonths: 60,
        vehicleVin: '1hgcm82633a004352',
        propertyAddress: 'stale',
      }),
    ).toEqual({ ...base, loanType: 'auto', termMonths: 60, vehicleVin: VALID_VIN });
  });

  it('enforces per-type term ranges', () => {
    const auto = { ...base, loanType: 'auto', vehicleVin: VALID_VIN };
    expect(loanApplicationSchema.safeParse({ ...auto, termMonths: 96 }).success).toBe(true);
    expect(loanApplicationSchema.safeParse({ ...auto, termMonths: 120 }).success).toBe(false);
  });

  it('requires the down payment to be below the loan amount', () => {
    const result = loanApplicationSchema.safeParse({
      ...base,
      loanType: 'mortgage',
      termMonths: 360,
      propertyAddress: '1 Main St',
      downPayment: 30_000,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ['downPayment'],
        message: 'Down payment must be less than the loan amount',
      }),
    ]);
  });
});
