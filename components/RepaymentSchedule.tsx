'use client';

import { useState } from 'react';
import type { LoanData } from '@/types';

interface RepaymentScheduleProps {
  loanData: LoanData;
}

export default function RepaymentSchedule({ loanData }: RepaymentScheduleProps) {
  const [showSchedule, setShowSchedule] = useState(false);

  // Calculate monthly payment and schedule
  const monthlyRate = 0.065 / 12; // Assuming 6.5% annual rate
  const numberOfPayments = loanData.loanTerm * 12;
  const monthlyPayment =
    (loanData.amount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  const schedule = [];
  let balance = loanData.amount;
  let totalInterest = 0;

  for (let i = 1; i <= numberOfPayments; i++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
    totalInterest += interestPayment;

    if (i % 12 === 0 || i === 1) {
      schedule.push({
        month: i,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
      });
    }
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Repayment Schedule</h2>
        <button
          onClick={() => {
            setShowSchedule(!showSchedule);
          }}
          className="font-semibold text-blue-600 hover:text-blue-800"
        >
          {showSchedule ? 'Hide' : 'Show'} Details
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-gray-600">Monthly Payment</p>
          <p className="text-2xl font-bold text-blue-900">${monthlyPayment.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-gray-600">Total Interest</p>
          <p className="text-2xl font-bold text-green-900">${totalInterest.toFixed(2)}</p>
        </div>
      </div>

      {showSchedule && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-100">
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Year</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Payment</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Principal</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Interest</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Balance</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">Year {Math.ceil(row.month / 12)}</td>
                  <td className="px-4 py-2 text-right text-gray-900">${row.payment.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-gray-900">
                    ${row.principal.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">${row.interest.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-gray-900">${row.balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
