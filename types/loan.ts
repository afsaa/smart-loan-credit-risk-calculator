export const LOAN_TYPES = ['mortgage', 'personal', 'auto'] as const;
export type LoanType = (typeof LOAN_TYPES)[number];

export const EMPLOYMENT_STATUSES = ['employed', 'self_employed', 'unemployed'] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const LOAN_PURPOSES = [
  'debt_consolidation',
  'home_improvement',
  'medical',
  'education',
  'other',
] as const;
export type LoanPurpose = (typeof LOAN_PURPOSES)[number];

declare const vinBrand: unique symbol;

/**
 * A normalised (upper-case, trimmed) 17-character VIN without I, O or Q.
 * Only obtainable through the validators in `lib/validation/vin.ts`.
 */
export type Vin = string & { readonly [vinBrand]: true };

export interface BaseLoanApplication {
  loanAmount: number;
  termMonths: number;
  annualIncome: number;
  monthlyDebt: number;
  creditScore: number;
  employmentStatus: EmploymentStatus;
}

export interface MortgageApplication extends BaseLoanApplication {
  loanType: 'mortgage';
  propertyAddress: string;
  downPayment: number;
}

export interface PersonalApplication extends BaseLoanApplication {
  loanType: 'personal';
  loanPurpose: LoanPurpose;
}

export interface AutoApplication extends BaseLoanApplication {
  loanType: 'auto';
  vehicleVin: Vin;
}

export type LoanApplication = MortgageApplication | PersonalApplication | AutoApplication;

export type LoanApplicationOf<T extends LoanType> = Extract<LoanApplication, { loanType: T }>;

type KeysOfUnion<T> = T extends unknown ? keyof T : never;

/** Every field name that can appear on any loan variant. */
export type LoanFieldName = KeysOfUnion<LoanApplication>;

export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export type RiskFactorId =
  | 'credit_score'
  | 'debt_to_income'
  | 'employment'
  | 'loan_to_value'
  | 'loan_purpose'
  | 'vehicle_age';

export interface RiskFactor {
  id: RiskFactorId;
  description: string;
  /** Risk points this factor contributed to the 0-100 score (higher is riskier). */
  impact: number;
}

export interface CreditAssessment {
  /** 0-100, higher is riskier. */
  score: number;
  level: RiskLevel;
  factors: readonly RiskFactor[];
  recommendation: string;
}

export type AssessmentError = { kind: 'service_unavailable'; message: string };

export type AssessmentResult =
  { ok: true; assessment: CreditAssessment } | { ok: false; error: AssessmentError };

export interface ScheduleRow {
  /** Month number (monthly granularity) or year number (yearly granularity), starting at 1. */
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface RepaymentSummary {
  loanType: LoanType;
  principal: number;
  annualRate: number;
  termMonths: number;
  /** Regular scheduled payment; the final payment may differ by a few cents. */
  monthlyPayment: number;
  totalInterest: number;
  /** Sum of all payments (principal + interest). */
  totalCost: number;
  /** (existing monthly debt + new payment) / gross monthly income. */
  debtToIncome: number;
  yearlySchedule: readonly ScheduleRow[];
}

export type FieldErrors = Partial<Record<LoanFieldName, readonly string[]>>;

export type SubmittedValues = Partial<Record<LoanFieldName, string>>;

export type FormState =
  | { status: 'idle' }
  | { status: 'error'; fieldErrors: FieldErrors; submittedValues: SubmittedValues }
  | {
      status: 'success';
      submissionId: string;
      application: LoanApplication;
      summary: RepaymentSummary;
      assessment: Promise<AssessmentResult>;
    };
