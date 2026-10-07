export type LoanType = 'mortgage' | 'personal' | 'auto';

type EmploymentStatus = 'employed' | 'self-employed' | 'unemployed';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskFactor {
  id: string;
  description: string;
}

export interface CreditAssessment {
  score: number;
  level: RiskLevel;
  factors: readonly RiskFactor[];
  recommendation: string;
}

export type AssessmentError = {
  kind: 'service_unavailable';
  message: string;
};

export type AssessmentResult =
  { ok: true; assessment: CreditAssessment } | { ok: false; error: AssessmentError };

type LoanPurpose = 'debt_consolidation' | 'home_improvement' | 'medical' | 'education' | 'other';

interface BaseLoanApplication {
  loanAmount: number;
  termMonths: number;
  annualIncome: number;
  monthlyDebt: number;
  creditScore: number;
  employmentStatus: EmploymentStatus;
}

export interface MortgageApplication extends BaseLoanApplication {
  propertyAddress: string;
  downPayment: number;
}

export interface PersonalApplication extends BaseLoanApplication {
  loanPurpose: LoanPurpose;
}

export interface AutoApplication extends BaseLoanApplication {
  vehicleVin: string;
}

export type LoanApplication = MortgageApplication | PersonalApplication | AutoApplication;
