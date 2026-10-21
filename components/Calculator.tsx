'use client';

import { useActionState } from 'react';
import { initialFormState } from '@/types/loan';
import { submitLoanApplication } from '@/app/actions/submit-loan-application';
import { LoanForm } from '@/components/LoanForm';
import { RepaymentSchedule } from '@/components/RepaymentSchedule';

export function Calculator() {
  const [state, formAction, isPending] = useActionState(submitLoanApplication, initialFormState);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <section
        aria-labelledby="loan-information-heading"
        className="rounded-lg bg-white p-8 shadow-lg"
      >
        <h2 id="loan-information-heading" className="mb-6 text-2xl font-semibold text-gray-900">
          Loan Information
        </h2>
        <LoanForm action={formAction} state={state} />
      </section>

      <section aria-label="Results" aria-live="polite" aria-busy={isPending} className="space-y-8">
        {state.status === 'success' ? (
          <RepaymentSchedule key={state.submissionId} summary={state.summary} />
        ) : (
          <div className="rounded-lg bg-white p-8 text-center text-gray-600 shadow">
            Fill in the loan details and press Calculate to see your repayment schedule.
          </div>
        )}
      </section>
    </div>
  );
}
