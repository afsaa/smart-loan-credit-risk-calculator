'use client';

import { useState } from 'react';
import LoanForm from './LoanForm';

// Interim shell: submission moves to a Server Action in plan step 3.7, which rewrites this file.
export default function Calculator() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900">Loan Information</h2>
        <LoanForm
          onCalculate={() => {
            setSubmitted(true);
          }}
        />
      </div>

      <div className="space-y-8" aria-live="polite">
        {submitted && (
          <div role="status" className="rounded-lg bg-blue-50 p-8 text-center shadow">
            <p className="text-blue-900">
              Calculations are temporarily unavailable while the form is rebuilt on Server Actions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
