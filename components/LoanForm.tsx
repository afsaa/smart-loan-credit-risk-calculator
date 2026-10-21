'use client';

import { useState } from 'react';
import type { FieldErrors, FormState, LoanType, SubmittedValues } from '@/types/loan';
import { CommonFields } from '@/components/form/CommonFields';
import { LoanTypeFields } from '@/components/form/LoanTypeFields';
import { LoanTypeSelect } from '@/components/form/LoanTypeSelect';
import { SubmitButton } from '@/components/form/SubmitButton';
import { formValuesFor, initialLoanType } from '@/components/form/form-values';

interface LoanFormProps {
  action: (formData: FormData) => void;
  state: FormState;
}

const NO_SUBMITTED_VALUES: SubmittedValues = {};
const NO_FIELD_ERRORS: FieldErrors = {};

export function LoanForm({ action, state }: LoanFormProps) {
  const submitted = state.status === 'idle' ? NO_SUBMITTED_VALUES : state.submittedValues;
  const [loanType, setLoanType] = useState<LoanType>(() => initialLoanType(submitted));

  const values = formValuesFor(loanType, submitted);
  // Errors describe the submitted loan type; hide them once the user switches to another one.
  const errors =
    state.status === 'error' && submitted.loanType === loanType
      ? state.fieldErrors
      : NO_FIELD_ERRORS;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form action={action} noValidate className="space-y-6">
      <LoanTypeSelect value={loanType} onLoanTypeChange={setLoanType} errors={errors.loanType} />
      <CommonFields values={values} errors={errors} />
      <LoanTypeFields key={loanType} loanType={loanType} values={values} errors={errors} />

      <p aria-live="polite" className="text-sm text-red-700">
        {hasErrors ? 'Some fields need attention. Fix them and submit again.' : ''}
      </p>

      <SubmitButton />
    </form>
  );
}
