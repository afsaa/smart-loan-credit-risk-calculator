/*
 * Compile-time tests: this file is checked by `npm run type-check` (tsc), not executed by Vitest.
 * Every `@ts-expect-error` below must be an actual error, otherwise tsc reports the directive as
 * unused, so each probe proves an impossible state is rejected.
 */
import { expectTypeOf } from 'vitest';
import type { z } from 'zod';
import type {
  AssessmentResult,
  BaseLoanApplication,
  FormState,
  LoanApplication,
  LoanFieldName,
  LoanType,
  Vin,
} from '@/types/loan';
import { assertNever } from '@/lib/utils/assert-never';
import type { LOAN_FIELD_NAMES, loanApplicationSchema } from '@/lib/validation/loan-schema';

declare const base: BaseLoanApplication;
declare const vehicleVin: Vin;

// (a) A mortgage without `downPayment` does not compile.
// @ts-expect-error mortgage requires downPayment
export const mortgageWithoutDownPayment: LoanApplication = {
  ...base,
  loanType: 'mortgage',
  propertyAddress: '1 Main St',
};

// (b) A personal loan cannot carry a VIN.
export const personalWithVin: LoanApplication = {
  ...base,
  loanType: 'personal',
  loanPurpose: 'medical',
  // @ts-expect-error vehicleVin does not exist on a personal application
  vehicleVin,
};

export const autoWithAddress: LoanApplication = {
  ...base,
  loanType: 'auto',
  vehicleVin,
  // @ts-expect-error propertyAddress does not exist on an auto application
  propertyAddress: '1 Main St',
};

// @ts-expect-error 'boat' is not a LoanType
export const unknownLoanType: LoanApplication = { ...base, loanType: 'boat' };

// @ts-expect-error a plain string is not a Vin; it must come from lib/validation/vin
export const unbrandedVin: Vin = '1HGCM82633A004352';

// (c) Narrowing on `loanType` exposes exactly the variant's fields.
export function narrowing(application: LoanApplication): void {
  if (application.loanType === 'auto') {
    expectTypeOf(application.vehicleVin).toEqualTypeOf<Vin>();
    expectTypeOf(application.vehicleVin).toExtend<string>();
    // @ts-expect-error propertyAddress is not available on an auto application
    expectTypeOf(application.propertyAddress);
  }

  switch (application.loanType) {
    case 'mortgage':
      expectTypeOf(application.propertyAddress).toEqualTypeOf<string>();
      expectTypeOf(application.downPayment).toEqualTypeOf<number>();
      // @ts-expect-error loanPurpose is not available on a mortgage application
      expectTypeOf(application.loanPurpose);
      break;
    case 'personal':
      expectTypeOf(application.loanPurpose).toEqualTypeOf<
        'debt_consolidation' | 'home_improvement' | 'medical' | 'education' | 'other'
      >();
      // @ts-expect-error vehicleVin is not available on a personal application
      expectTypeOf(application.vehicleVin);
      break;
    case 'auto':
      expectTypeOf(application.vehicleVin).toEqualTypeOf<Vin>();
      break;
    default:
      expectTypeOf(application).toBeNever();
      assertNever(application);
  }
}

// (d) Adding a fourth loan type breaks every exhaustive switch. Simulated here by widening the
// union. Verified manually once: adding a `StudentApplication` variant fails tsc in the
// `assertNever` switches (lib/finance/summary.ts, lib/credit/scoring.ts, this file) and the schema
// equality check below; adding 'student' to LOAN_TYPES alone fails every Record<LoanType, ...>.
type ExtendedLoanType = LoanType | 'boat';

export function describeLoanType(loanType: ExtendedLoanType): string {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- intentional probe; lint also catches the missing case
  switch (loanType) {
    case 'mortgage':
    case 'personal':
    case 'auto':
      return loanType;
    default:
      // @ts-expect-error 'boat' is not handled, so loanType is not narrowed to never
      return assertNever(loanType);
  }
}

// The Zod schema output and the hand-written union stay in sync.
expectTypeOf<z.output<typeof loanApplicationSchema>>().toEqualTypeOf<LoanApplication>();

// The runtime field-name list covers every field of every variant.
expectTypeOf<(typeof LOAN_FIELD_NAMES)[number]>().toEqualTypeOf<LoanFieldName>();

// `FormState` exposes the assessment only after narrowing to success.
export function formStateNarrowing(state: FormState): void {
  // @ts-expect-error assessment only exists on the success state
  expectTypeOf(state.assessment);

  if (state.status === 'success') {
    expectTypeOf(state.assessment).toEqualTypeOf<Promise<AssessmentResult>>();
  }
  if (state.status === 'error') {
    // @ts-expect-error summary only exists on the success state
    expectTypeOf(state.summary);
  }
}
