import type { ScheduleRow } from '@/types/loan';
import { formatCurrency } from '@/lib/utils/format';

interface RepaymentDetailsProps {
  yearlyRows: readonly ScheduleRow[];
}

export function RepaymentDetails({ yearlyRows }: RepaymentDetailsProps) {
  return (
    <details>
      <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
        Show details
      </summary>
      <div className="mt-4 overflow-x-auto">
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
            {yearlyRows.map((row) => (
              <tr key={row.period} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-900">Year {row.period}</td>
                <td className="px-4 py-2 text-right text-gray-900">
                  {formatCurrency(row.payment)}
                </td>
                <td className="px-4 py-2 text-right text-gray-900">
                  {formatCurrency(row.principal)}
                </td>
                <td className="px-4 py-2 text-right text-gray-900">
                  {formatCurrency(row.interest)}
                </td>
                <td className="px-4 py-2 text-right text-gray-900">
                  {formatCurrency(row.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
