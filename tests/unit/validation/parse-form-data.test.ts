import { describe, expect, it } from 'vitest';
import type { FieldErrors, LoanFieldName } from '@/types/loan';
import { parseLoanFormData } from '@/lib/validation/parse-form-data';
import { VALID_VIN } from '@/tests/unit/fixtures/loan-applications';

type Fields = Record<string, string>;

const common: Fields = {
  loanAmount: '30000',
  annualIncome: '90000',
  monthlyDebt: '500',
  creditScore: '720',
  employmentStatus: 'employed',
};

const mortgage: Fields = {
  ...common,
  loanType: 'mortgage',
  loanAmount: '300000',
  termMonths: '360',
  propertyAddress: '1 Main St',
  downPayment: '60000',
};
const personal: Fields = {
  ...common,
  loanType: 'personal',
  termMonths: '60',
  loanPurpose: 'medical',
};
const auto: Fields = { ...common, loanType: 'auto', termMonths: '60', vehicleVin: VALID_VIN };

function formData(fields: Fields): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.append(key, value);
  }
  return data;
}

function without(fields: Fields, key: string): Fields {
  return Object.fromEntries(Object.entries(fields).filter(([name]) => name !== key));
}

function fieldErrorsOf(fields: Fields | FormData): FieldErrors {
  const result = parseLoanFormData(fields instanceof FormData ? fields : formData(fields));
  if (result.ok) {
    throw new Error('expected parsing to fail');
  }
  return result.fieldErrors;
}

describe('parseLoanFormData: happy paths', () => {
  it('parses a mortgage', () => {
    expect(parseLoanFormData(formData(mortgage))).toEqual({
      ok: true,
      application: {
        loanType: 'mortgage',
        loanAmount: 300_000,
        termMonths: 360,
        annualIncome: 90_000,
        monthlyDebt: 500,
        creditScore: 720,
        employmentStatus: 'employed',
        propertyAddress: '1 Main St',
        downPayment: 60_000,
      },
    });
  });

  it('parses a personal loan', () => {
    expect(parseLoanFormData(formData(personal))).toMatchObject({
      ok: true,
      application: { loanType: 'personal', loanPurpose: 'medical', termMonths: 60 },
    });
  });

  it('parses an auto loan, normalising the VIN and trimming inputs', () => {
    expect(
      parseLoanFormData(
        formData({ ...auto, vehicleVin: ` ${VALID_VIN.toLowerCase()} `, loanAmount: ' 25000 ' }),
      ),
    ).toMatchObject({
      ok: true,
      application: { loanType: 'auto', vehicleVin: VALID_VIN, loanAmount: 25_000 },
    });
  });

  it('ignores fields that belong to other loan types and unknown keys', () => {
    const result = parseLoanFormData(
      formData({ ...personal, vehicleVin: VALID_VIN, propertyAddress: 'stale', ssn: '123' }),
    );
    expect(result.ok).toBe(true);
    expect(result.ok && result.application).not.toHaveProperty('vehicleVin');
    expect(result.ok && result.application).not.toHaveProperty('propertyAddress');
    expect(result.ok && result.application).not.toHaveProperty('ssn');
  });
});

describe('parseLoanFormData: loanType', () => {
  it.each([
    ['missing', without(mortgage, 'loanType')],
    ['unknown', { ...mortgage, loanType: 'student' }],
    ['wrong case', { ...mortgage, loanType: 'Mortgage' }],
  ])('rejects a %s loanType', (_, fields) => {
    expect(fieldErrorsOf(fields)).toEqual({ loanType: ['Select a loan type'] });
  });
});

describe('parseLoanFormData: variant-specific fields', () => {
  it.each<[string, Fields, LoanFieldName]>([
    ['mortgage without propertyAddress', without(mortgage, 'propertyAddress'), 'propertyAddress'],
    [
      'mortgage with blank propertyAddress',
      { ...mortgage, propertyAddress: '   ' },
      'propertyAddress',
    ],
    ['mortgage without downPayment', without(mortgage, 'downPayment'), 'downPayment'],
    ['mortgage with negative downPayment', { ...mortgage, downPayment: '-1' }, 'downPayment'],
    [
      'mortgage with downPayment >= loanAmount',
      { ...mortgage, downPayment: '300000' },
      'downPayment',
    ],
    ['personal without loanPurpose', without(personal, 'loanPurpose'), 'loanPurpose'],
    ['personal with unknown loanPurpose', { ...personal, loanPurpose: 'vacation' }, 'loanPurpose'],
    ['auto without vehicleVin', without(auto, 'vehicleVin'), 'vehicleVin'],
    ['auto with a VIN containing O', { ...auto, vehicleVin: '1HGCM82633O004352' }, 'vehicleVin'],
    ['auto with a term above its range', { ...auto, termMonths: '120' }, 'termMonths'],
  ])('reports %s', (_, fields, field) => {
    const errors = fieldErrorsOf(fields);
    expect(Object.keys(errors)).toEqual([field]);
    expect(errors[field]?.length).toBeGreaterThan(0);
  });

  it('reports every invalid field at once with readable messages', () => {
    expect(
      fieldErrorsOf({ ...auto, loanAmount: '', creditScore: '851', vehicleVin: 'abc' }),
    ).toEqual({
      loanAmount: ['Loan amount is required'],
      creditScore: ['Credit score must be at most 850'],
      vehicleVin: ['VIN must be 17 letters or digits (I, O and Q are not allowed)'],
    });
  });
});

describe('parseLoanFormData: numeric inputs', () => {
  it.each(['', 'abc', 'NaN', 'Infinity', '1e9', '0x10', '1,000'])(
    'rejects loanAmount %j',
    (value) => {
      expect(fieldErrorsOf({ ...personal, loanAmount: value })).toHaveProperty('loanAmount');
    },
  );

  it.each([
    ['creditScore', '299', false],
    ['creditScore', '300', true],
    ['creditScore', '850', true],
    ['creditScore', '851', false],
    ['creditScore', '700.5', false],
    ['termMonths', '60.5', false],
    ['loanAmount', '999.99', false],
    ['loanAmount', '1000', true],
    ['loanAmount', '5000000', true],
    ['loanAmount', '5000000.01', false],
    ['annualIncome', '0', false],
    ['monthlyDebt', '0', true],
    ['monthlyDebt', '-1', false],
  ])('%s = %s -> valid: %s', (field, value, valid) => {
    expect(parseLoanFormData(formData({ ...personal, [field]: value })).ok).toBe(valid);
  });
});

describe('parseLoanFormData: hostile FormData', () => {
  it('rejects a File supplied for a text field', () => {
    const data = formData(without(personal, 'loanPurpose'));
    data.append('loanPurpose', new File(['medical'], 'purpose.txt'));
    expect(fieldErrorsOf(data)).toEqual({ loanPurpose: ['Must be text, not a file'] });
  });

  it('rejects duplicated keys', () => {
    const data = formData(personal);
    data.append('creditScore', '800');
    expect(fieldErrorsOf(data)).toEqual({ creditScore: ['Provide a single value'] });
  });

  it('never throws on arbitrary FormData', () => {
    const data = new FormData();
    data.append('loanType', new File([''], 'x'));
    data.append('__proto__', 'x');
    expect(() => parseLoanFormData(data)).not.toThrow();
    expect(() => parseLoanFormData(new FormData())).not.toThrow();
    expect(parseLoanFormData(data).ok).toBe(false);
  });
});
