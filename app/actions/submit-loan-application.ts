'use server';

import { assessCredit } from '@/lib/credit/assess-credit';
import { computeRepaymentSummary } from '@/lib/finance/summary';
import { parseLoanFormData, readSubmittedValues } from '@/lib/validation/parse-form-data';
import type { FormState } from '@/types/loan';

/** Upper bound for the mock engine so a hung assessment cannot stream forever. */
const ASSESSMENT_TIMEOUT_MS = 10_000;

export async function submitLoanApplication(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const submittedValues = readSubmittedValues(formData);
  const parsed = parseLoanFormData(formData);

  if (!parsed.ok) {
    return { status: 'error', fieldErrors: parsed.fieldErrors, submittedValues };
  }

  const { application } = parsed;
  const summary = computeRepaymentSummary(application);
  const assessment = assessCredit(application, {
    signal: AbortSignal.timeout(ASSESSMENT_TIMEOUT_MS),
  });

  return {
    status: 'success',
    submissionId: crypto.randomUUID(),
    submittedValues,
    application,
    summary,
    assessment,
  };
}
