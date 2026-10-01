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
    (loanData.amount *
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
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
    <div className="bg-white rounded-lg shadow p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Repayment Schedule
        </h2>
        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className="text-blue-600 hover:text-blue-800 font-semibold"
        >
          {showSchedule ? 'Hide' : 'Show'} Details
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Monthly Payment</p>
          <p className="text-2xl font-bold text-blue-900">
            ${monthlyPayment.toFixed(2)}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm">Total Interest</p>
          <p className="text-2xl font-bold text-green-900">
            ${totalInterest.toFixed(2)}
          </p>
        </div>
      </div>

      {showSchedule && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-2 text-left text-gray-700 font-semibold">
                  Year
                </th>
                <th className="px-4 py-2 text-right text-gray-700 font-semibold">
                  Payment
                </th>
                <th className="px-4 py-2 text-right text-gray-700 font-semibold">
                  Principal
                </th>
                <th className="px-4 py-2 text-right text-gray-700 font-semibold">
                  Interest
                </th>
                <th className="px-4 py-2 text-right text-gray-700 font-semibold">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-2 text-gray-900">
                    Year {Math.ceil(row.month / 12)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">
                    ${row.payment.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">
                    ${row.principal.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">
                    ${row.interest.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">
                    ${row.balance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
