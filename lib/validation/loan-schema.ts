import { z } from 'zod';
import {
  EMPLOYMENT_STATUSES,
  LOAN_PURPOSES,
  type LoanFieldName,
  type LoanType,
  type Vin,
} from '@/types/loan';
import { isVin, normalizeVin } from '@/lib/validation/vin';

interface Range {
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

export const LOAN_FIELD_NAMES = [
  'loanType',
  'loanAmount',
  'termMonths',
  'annualIncome',
  'monthlyDebt',
  'creditScore',
  'employmentStatus',
  'propertyAddress',
  'downPayment',
  'loanPurpose',
  'vehicleVin',
] as const satisfies readonly LoanFieldName[];

export function isLoanFieldName(value: PropertyKey): value is LoanFieldName {
  return LOAN_FIELD_NAMES.some((name) => name === value);
}

/** Plain decimal notation only: rejects `''`, `'1e9'`, `'0x10'`, `'Infinity'`, `'1,000'`. */
const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

function toNumberInput(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    return undefined;
  }
  return DECIMAL_PATTERN.test(trimmed) ? Number(trimmed) : Number.NaN;
}

function numberField(label: string): z.ZodNumber {
  return z.number({
    error: (issue) =>
      issue.input === undefined ? `${label} is required` : `${label} must be a number`,
  });
}

function numeric<T extends z.ZodType<number>>(schema: T) {
  return z.preprocess(toNumberInput, schema);
}

function termMonthsField(loanType: LoanType) {
  const { min, max } = TERM_MONTHS_RANGE[loanType];
  return numeric(
    numberField('Term')
      .int('Term must be a whole number of months')
      .min(min, `Term must be at least ${String(min)} months`)
      .max(max, `Term must be at most ${String(max)} months`),
  );
}

const baseShape = {
  loanAmount: numeric(
    numberField('Loan amount')
      .min(LOAN_AMOUNT_RANGE.min, 'Loan amount must be at least $1,000')
      .max(LOAN_AMOUNT_RANGE.max, 'Loan amount must be at most $5,000,000'),
  ),
  annualIncome: numeric(numberField('Annual income').positive('Annual income must be above 0')),
  monthlyDebt: numeric(numberField('Monthly debt').nonnegative('Monthly debt cannot be negative')),
  creditScore: numeric(
    numberField('Credit score')
      .int('Credit score must be a whole number')
      .min(CREDIT_SCORE_RANGE.min, 'Credit score must be at least 300')
      .max(CREDIT_SCORE_RANGE.max, 'Credit score must be at most 850'),
  ),
  employmentStatus: z.enum(EMPLOYMENT_STATUSES, { error: 'Select an employment status' }),
};

const vinField = z.string({ error: 'Vehicle VIN is required' }).transform((value, ctx): Vin => {
  const normalized = normalizeVin(value);
  if (isVin(normalized)) {
    return normalized;
  }
  ctx.issues.push({
    code: 'custom',
    input: value,
    message:
      normalized === ''
        ? 'Vehicle VIN is required'
        : 'VIN must be 17 letters or digits (I, O and Q are not allowed)',
  });
  return z.NEVER;
});

export const mortgageApplicationSchema = z
  .object({
    loanType: z.literal('mortgage'),
    ...baseShape,
    termMonths: termMonthsField('mortgage'),
    propertyAddress: z
      .string({ error: 'Property address is required' })
      .trim()
      .min(1, 'Property address is required')
      .max(PROPERTY_ADDRESS_MAX_LENGTH, 'Property address is too long'),
    downPayment: numeric(
      numberField('Down payment').nonnegative('Down payment cannot be negative'),
    ),
  })
  .refine((application) => application.downPayment < application.loanAmount, {
    path: ['downPayment'],
    error: 'Down payment must be less than the loan amount',
  });

export const personalApplicationSchema = z.object({
  loanType: z.literal('personal'),
  ...baseShape,
  termMonths: termMonthsField('personal'),
  loanPurpose: z.enum(LOAN_PURPOSES, { error: 'Select a loan purpose' }),
});

export const autoApplicationSchema = z.object({
  loanType: z.literal('auto'),
  ...baseShape,
  termMonths: termMonthsField('auto'),
  vehicleVin: vinField,
});

export const loanApplicationSchema = z.discriminatedUnion(
  'loanType',
  [mortgageApplicationSchema, personalApplicationSchema, autoApplicationSchema],
  { error: 'Select a loan type' },
);

const LOAN_FIELDS_BY_TYPE: Record<LoanType, readonly LoanFieldName[]> = {
  mortgage: Object.keys(mortgageApplicationSchema.shape).filter(isLoanFieldName),
  personal: Object.keys(personalApplicationSchema.shape).filter(isLoanFieldName),
  auto: Object.keys(autoApplicationSchema.shape).filter(isLoanFieldName),
};

/** The fields (including `loanType`) that belong to the given loan variant. */
export function loanFieldsFor(loanType: LoanType): readonly LoanFieldName[] {
  return LOAN_FIELDS_BY_TYPE[loanType];
}
