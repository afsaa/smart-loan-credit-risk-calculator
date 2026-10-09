import type {
  EmploymentStatus,
  LoanApplication,
  LoanPurpose,
  RiskFactor,
  RiskLevel,
  Vin,
} from '@/types/loan';
import { assertNever } from '@/lib/utils/assert-never';
import { formatPercent } from '@/lib/utils/format';
import { monthlyPayment } from '@/lib/finance/amortization';
import { annualRateFor } from '@/lib/finance/rates';
import { debtToIncomeRatio, loanPrincipal } from '@/lib/finance/summary';

/*
 * Illustrative mock model, not a real credit model. Each factor adds risk points; the total is
 * clamped to 0-100 (higher is riskier). Maximum contributions:
 *   credit score 50, debt-to-income 25, employment 15, loan-type-specific factor 10.
 */

export interface ScoreBreakdown {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
}

export interface ScoringOptions {
  /** Calendar year used to derive vehicle age from the VIN. */
  referenceYear: number;
}

/** Scores at or above these thresholds map to the level. */
export const RISK_THRESHOLDS = { medium: 35, high: 60 } as const;

const CREDIT_SCORE_MAX_POINTS = 50;
const DTI_MAX_POINTS = 25;
const DTI_FLOOR = 0.2;
const DTI_CEILING = 0.5;
const TYPE_FACTOR_MAX_POINTS = 10;
const LTV_FLOOR = 0.8;
const VEHICLE_AGE_FLOOR_YEARS = 3;
const VEHICLE_AGE_CEILING_YEARS = 13;
const UNKNOWN_VEHICLE_AGE_POINTS = 5;

const EMPLOYMENT_POINTS = {
  employed: 0,
  self_employed: 5,
  unemployed: 15,
} as const satisfies Record<EmploymentStatus, number>;

const EMPLOYMENT_LABELS = {
  employed: 'employed',
  self_employed: 'self-employed',
  unemployed: 'unemployed',
} as const satisfies Record<EmploymentStatus, string>;

const LOAN_PURPOSE_POINTS = {
  debt_consolidation: 4,
  home_improvement: 2,
  medical: 6,
  education: 3,
  other: 8,
} as const satisfies Record<LoanPurpose, number>;

const LOAN_PURPOSE_LABELS = {
  debt_consolidation: 'debt consolidation',
  home_improvement: 'home improvement',
  medical: 'medical',
  education: 'education',
  other: 'other',
} as const satisfies Record<LoanPurpose, string>;

/** 10th-character model-year codes; the sequence repeats every 30 years starting at 1980. */
const MODEL_YEAR_CODES = 'ABCDEFGHJKLMNPRSTVWXY123456789';
const MODEL_YEAR_EPOCH = 1980;
const MODEL_YEAR_CYCLE = 30;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Linear 0..1 ramp between `floor` and `ceiling`. */
function ramp(value: number, floor: number, ceiling: number): number {
  return clamp((value - floor) / (ceiling - floor), 0, 1);
}

function roundPoints(points: number): number {
  return Math.round(points * 10) / 10;
}

/**
 * Decodes the model year from the VIN's 10th character, choosing the most recent year in the
 * 30-year cycle that is not later than `referenceYear + 1`. Returns `null` for codes that are not
 * model-year codes (`0`, `U`, `Z`).
 */
export function decodeVinModelYear(vin: Vin, referenceYear: number): number | null {
  const index = MODEL_YEAR_CODES.indexOf(vin.charAt(9));
  if (index === -1) {
    return null;
  }
  const firstYear = MODEL_YEAR_EPOCH + index;
  const cycles = Math.floor((referenceYear + 1 - firstYear) / MODEL_YEAR_CYCLE);
  return firstYear + MODEL_YEAR_CYCLE * Math.max(cycles, 0);
}

export function riskLevelForScore(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.high) {
    return 'high';
  }
  if (score >= RISK_THRESHOLDS.medium) {
    return 'medium';
  }
  return 'low';
}

function loanTypeFactor(application: LoanApplication, options: ScoringOptions): RiskFactor {
  switch (application.loanType) {
    case 'mortgage': {
      const loanToValue = loanPrincipal(application) / application.loanAmount;
      return {
        id: 'loan_to_value',
        description: `Loan-to-value ratio of ${formatPercent(loanToValue)}`,
        impact: roundPoints(TYPE_FACTOR_MAX_POINTS * ramp(loanToValue, LTV_FLOOR, 1)),
      };
    }
    case 'personal':
      return {
        id: 'loan_purpose',
        description: `Loan purpose: ${LOAN_PURPOSE_LABELS[application.loanPurpose]}`,
        impact: LOAN_PURPOSE_POINTS[application.loanPurpose],
      };
    case 'auto': {
      const modelYear = decodeVinModelYear(application.vehicleVin, options.referenceYear);
      if (modelYear === null) {
        return {
          id: 'vehicle_age',
          description: 'Vehicle model year could not be determined from the VIN',
          impact: UNKNOWN_VEHICLE_AGE_POINTS,
        };
      }
      const age = Math.max(options.referenceYear - modelYear, 0);
      return {
        id: 'vehicle_age',
        description: `Vehicle model year ${String(modelYear)} (${String(age)} years old)`,
        impact: roundPoints(
          TYPE_FACTOR_MAX_POINTS * ramp(age, VEHICLE_AGE_FLOOR_YEARS, VEHICLE_AGE_CEILING_YEARS),
        ),
      };
    }
    default:
      return assertNever(application);
  }
}

export function scoreApplication(
  application: LoanApplication,
  options: ScoringOptions,
): ScoreBreakdown {
  const payment = monthlyPayment(
    loanPrincipal(application),
    annualRateFor(application.loanType),
    application.termMonths,
  );
  const debtToIncome = debtToIncomeRatio(
    application.monthlyDebt,
    application.annualIncome,
    payment,
  );

  const factors: RiskFactor[] = [
    {
      id: 'credit_score',
      description: `Credit score of ${String(application.creditScore)} (300-850 scale)`,
      impact: roundPoints(CREDIT_SCORE_MAX_POINTS * (1 - ramp(application.creditScore, 300, 850))),
    },
    {
      id: 'debt_to_income',
      description: `Debt-to-income ratio of ${formatPercent(debtToIncome)} including the new payment`,
      impact: roundPoints(DTI_MAX_POINTS * ramp(debtToIncome, DTI_FLOOR, DTI_CEILING)),
    },
    {
      id: 'employment',
      description: `Employment status: ${EMPLOYMENT_LABELS[application.employmentStatus]}`,
      impact: EMPLOYMENT_POINTS[application.employmentStatus],
    },
    loanTypeFactor(application, options),
  ];

  const total = factors.reduce((sum, factor) => sum + factor.impact, 0);
  const score = Math.round(clamp(total, 0, 100));
  return { score, level: riskLevelForScore(score), factors };
}
