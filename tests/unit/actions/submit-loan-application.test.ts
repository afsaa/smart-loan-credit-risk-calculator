import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AssessmentResult, FormState } from '@/types/loan';
import { initialFormState } from '@/types/loan';
import { submitLoanApplication } from '@/app/actions/submit-loan-application';
import { assessCredit } from '@/lib/credit/assess-credit';
import { computeRepaymentSummary } from '@/lib/finance/summary';
import { mortgageApplication } from '@/tests/unit/fixtures/loan-applications';

vi.mock('@/lib/credit/assess-credit', () => ({ assessCredit: vi.fn() }));

const assessment: Promise<AssessmentResult> = Promise.resolve({
  ok: false,
  error: { kind: 'service_unavailable', message: 'mocked' },
});

const validMortgage = {
  loanType: 'mortgage',
  loanAmount: '300000',
  termMonths: '360',
  annualIncome: '90000',
  monthlyDebt: '500',
  creditScore: '720',
  employmentStatus: 'employed',
  propertyAddress: '1 Main St, Springfield',
  downPayment: '60000',
};

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.append(key, value);
  }
  return data;
}

function expectSuccess(state: FormState): Extract<FormState, { status: 'success' }> {
  if (state.status !== 'success') {
    throw new Error(`expected success, got ${state.status}`);
  }
  return state;
}

beforeEach(() => {
  vi.mocked(assessCredit).mockReset().mockReturnValue(assessment);
});

describe('submitLoanApplication', () => {
  it('returns field errors and echoes the submitted values when parsing fails', async () => {
    const fields = { ...validMortgage, propertyAddress: '', downPayment: 'abc' };

    const state = await submitLoanApplication(initialFormState, formData(fields));

    expect(state).toEqual({
      status: 'error',
      fieldErrors: {
        propertyAddress: ['Property address is required'],
        downPayment: ['Down payment must be a number'],
      },
      submittedValues: fields,
    });
    expect(assessCredit).not.toHaveBeenCalled();
  });

  it('handles the first submission from the idle state', async () => {
    const state = await submitLoanApplication(initialFormState, formData(validMortgage));
    expect(state.status).toBe('success');
  });

  it('returns the summary immediately and the pending assessment promise', async () => {
    const state = expectSuccess(
      await submitLoanApplication(initialFormState, formData(validMortgage)),
    );

    const application = mortgageApplication();
    expect(state.application).toEqual(application);
    expect(state.summary).toEqual(computeRepaymentSummary(application));
    expect(state.submittedValues).toEqual(validMortgage);
    expect(state.assessment).toBe(assessment);
  });

  it('starts the assessment with a live timeout signal', async () => {
    await submitLoanApplication(initialFormState, formData(validMortgage));

    expect(assessCredit).toHaveBeenCalledOnce();
    const [application, options] = vi.mocked(assessCredit).mock.calls[0] ?? [];
    expect(application).toEqual(mortgageApplication());
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(options?.signal?.aborted).toBe(false);
  });

  it('issues a new submission id for every successful submission', async () => {
    const first = expectSuccess(
      await submitLoanApplication(initialFormState, formData(validMortgage)),
    );
    const second = expectSuccess(await submitLoanApplication(first, formData(validMortgage)));

    expect(first.submissionId).not.toBe('');
    expect(second.submissionId).not.toBe(first.submissionId);
  });
});
