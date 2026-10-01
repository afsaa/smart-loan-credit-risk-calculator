'use client';

import { useState } from 'react';
import type { LoanData, LoanCategory } from '@/types';

const LOAN_CATEGORIES: readonly LoanCategory[] = ['Mortgage', 'Personal', 'Auto'];

function isLoanCategory(value: string): value is LoanCategory {
  return LOAN_CATEGORIES.some((category) => category === value);
}

interface LoanFormProps {
  onCalculate: (data: LoanData) => void;
  isLoading: boolean;
}

export default function LoanForm({ onCalculate, isLoading }: LoanFormProps) {
  const [formData, setFormData] = useState<LoanData>({
    amount: 250000,
    annualIncome: 75000,
    creditScore: 700,
    loanTerm: 30,
    category: 'Mortgage',
    employmentStatus: 'Employed',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'category') {
      if (isLoanCategory(value)) {
        setFormData({ ...formData, category: value });
      }
      return;
    }
    setFormData({ ...formData, [name]: Number(value) });
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    onCalculate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Loan Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="Mortgage">Mortgage</option>
          <option value="Personal">Personal</option>
          <option value="Auto">Auto</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Loan Amount: ${formData.amount.toLocaleString()}
        </label>
        <input
          type="range"
          name="amount"
          min="5000"
          max="1000000"
          step="5000"
          value={formData.amount}
          onChange={handleChange}
          className="w-full"
          disabled={isLoading}
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
          disabled={isLoading}
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
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Loan Term (years): {formData.loanTerm}
        </label>
        <input
          type="range"
          name="loanTerm"
          min="5"
          max="30"
          step="1"
          value={formData.loanTerm}
          onChange={handleChange}
          className="w-full"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Employment Status</label>
        <select
          name="employmentStatus"
          value={formData.employmentStatus}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="Employed">Employed</option>
          <option value="Self-employed">Self-employed</option>
          <option value="Unemployed">Unemployed</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isLoading ? 'Calculating...' : 'Calculate Risk & Schedule'}
      </button>
    </form>
  );
}
