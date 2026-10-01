'use client';

import { useState } from 'react';
import type { LoanData, LoanCategory } from '@/types';

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'category' ? (value as LoanCategory) : Number(value),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loan Category
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        >
          <option value="Mortgage">Mortgage</option>
          <option value="Personal">Personal</option>
          <option value="Auto">Auto</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Employment Status
        </label>
        <select
          name="employmentStatus"
          value={formData.employmentStatus}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {isLoading ? 'Calculating...' : 'Calculate Risk & Schedule'}
      </button>
    </form>
  );
}
