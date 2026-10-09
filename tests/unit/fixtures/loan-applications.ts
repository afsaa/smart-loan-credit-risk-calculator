import type {
  AutoApplication,
  BaseLoanApplication,
  MortgageApplication,
  PersonalApplication,
  Vin,
} from '@/types/loan';
import { toVin } from '@/lib/validation/vin';

/** Honda VIN with model-year code `3` (2003). */
export const VALID_VIN = '1HGCM82633A004352';

export function vin(value: string): Vin {
  const parsed = toVin(value);
  if (parsed === null) {
    throw new Error(`Invalid VIN fixture: ${value}`);
  }
  return parsed;
}

const base: BaseLoanApplication = {
  loanAmount: 30_000,
  termMonths: 60,
  annualIncome: 90_000,
  monthlyDebt: 500,
  creditScore: 720,
  employmentStatus: 'employed',
};

export function mortgageApplication(
  overrides: Partial<Omit<MortgageApplication, 'loanType'>> = {},
): MortgageApplication {
  return {
    ...base,
    loanAmount: 300_000,
    termMonths: 360,
    propertyAddress: '1 Main St, Springfield',
    downPayment: 60_000,
    ...overrides,
    loanType: 'mortgage',
  };
}

export function personalApplication(
  overrides: Partial<Omit<PersonalApplication, 'loanType'>> = {},
): PersonalApplication {
  return { ...base, loanPurpose: 'debt_consolidation', ...overrides, loanType: 'personal' };
}

export function autoApplication(
  overrides: Partial<Omit<AutoApplication, 'loanType'>> = {},
): AutoApplication {
  return { ...base, vehicleVin: vin(VALID_VIN), ...overrides, loanType: 'auto' };
}
