import type { RepaymentSummary } from '@/types/loan';
import { formatCurrency } from '@/lib/utils/format';
import { RepaymentDetails } from '@/components/RepaymentDetails';

interface RepaymentScheduleProps {
  summary: RepaymentSummary;
}

export function RepaymentSchedule({ summary }: RepaymentScheduleProps) {
  return (
    <div className="rounded-lg bg-white p-8 shadow">
      <h2 className="mb-6 text-2xl font-semibold text-gray-900">Repayment Schedule</h2>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-gray-600">Monthly Payment</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(summary.monthlyPayment)}
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-gray-600">Total Interest</p>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(summary.totalInterest)}
          </p>
        </div>
      </div>

      <RepaymentDetails yearlyRows={summary.yearlySchedule} />
    </div>
  );
}
