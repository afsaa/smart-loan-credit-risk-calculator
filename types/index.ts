export type LoanCategory = 'Mortgage' | 'Personal' | 'Auto';

export interface LoanData {
  amount: number;
  annualIncome: number;
  creditScore: number;
  loanTerm: number;
  category: LoanCategory;
  employmentStatus: string;
}

export interface RiskResult {
  score: number;
  level: 'low' | 'medium' | 'high' | 'unknown' | 'error';
  factors: string[];
  recommendation: string;
}
