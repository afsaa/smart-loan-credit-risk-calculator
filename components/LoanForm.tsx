'use client';

import { useState } from 'react';
import { EMPLOYMENT_STATUSES, LOAN_TYPES } from '@/types/loan';
import type { EmploymentStatus, LoanType } from '@/types/loan';
import { isEmploymentStatus, isLoanType } from '@/lib/validation/guards';

const LOAN_TYPE_LABELS = {
  mortgage: 'Mortgage',
  personal: 'Personal',
  auto: 'Auto',
} as const satisfies Record<LoanType, string>;

const EMPLOYMENT_STATUS_LABELS = {
  employed: 'Employed',
  self_employed: 'Self-employed',
  unemployed: 'Unemployed',
} as const satisfies Record<EmploymentStatus, string>;

// Interim control state; plan step 3.6 replaces this form with `<form action>` + uncontrolled inputs.
interface LoanFormValues {
  loanType: LoanType;
  loanAmount: number;
  annualIncome: number;
  creditScore: number;
  termYears: number;
  employmentStatus: EmploymentStatus;
}

interface LoanFormProps {
  onCalculate: () => void;
}

export default function LoanForm({ onCalculate }: LoanFormProps) {
  const [formData, setFormData] = useState<LoanFormValues>({
    loanType: 'mortgage',
    loanAmount: 250000,
    annualIncome: 75000,
    creditScore: 700,
    termYears: 30,
    employmentStatus: 'employed',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'loanType') {
      if (isLoanType(value)) {
        setFormData({ ...formData, loanType: value });
      }
      return;
    }
    if (name === 'employmentStatus') {
      if (isEmploymentStatus(value)) {
        setFormData({ ...formData, employmentStatus: value });
      }
      return;
    }
    setFormData({ ...formData, [name]: Number(value) });
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    onCalculate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Loan Category</label>
        <select
          name="loanType"
          value={formData.loanType}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-500 p-2 focus:border-2 focus:outline-none"
        >
          {LOAN_TYPES.map((loanType) => (
            <option key={loanType} value={loanType}>
              {LOAN_TYPE_LABELS[loanType]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Loan Amount: ${formData.loanAmount.toLocaleString()}
        </label>
        <input
          type="range"
          name="loanAmount"
          min="5000"
          max="1000000"
          step="5000"
          value={formData.loanAmount}
          onChange={handleChange}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Annual Income: ${formData.annualIncome.toLocaleString()}
        </label>
        <input
          type="range"
          name="annualIncome"
          min="20000"
          max="500000"
          step="5000"
          value={formData.annualIncome}
          onChange={handleChange}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Credit Score: {formData.creditScore}
        </label>
        <input
          type="range"
          name="creditScore"
          min="300"
          max="850"
          step="10"
          value={formData.creditScore}
          onChange={handleChange}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Loan Term (years): {formData.termYears}
        </label>
        <input
          type="range"
          name="termYears"
          min="5"
          max="30"
          step="1"
          value={formData.termYears}
          onChange={handleChange}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Employment Status</label>
        <select
          name="employmentStatus"
          value={formData.employmentStatus}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-500 p-2 focus:border-2 focus:outline-none"
        >
          {EMPLOYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {EMPLOYMENT_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        Calculate Risk & Schedule
      </button>
    </form>
  );
}
