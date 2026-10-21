import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { FormState } from '@/types/loan';
import { initialFormState } from '@/types/loan';
import { LoanForm } from '@/components/LoanForm';

const TYPE_SPECIFIC_LABELS = [
  'Property address',
  'Down payment ($)',
  'Loan purpose',
  'Vehicle VIN',
];

function renderForm(state: FormState = initialFormState) {
  const view = render(<LoanForm action={vi.fn()} state={state} />);
  const form = view.container.querySelector('form');
  if (!(form instanceof HTMLFormElement)) {
    throw new Error('LoanForm did not render a <form>');
  }
  return { ...view, form };
}

function visibleTypeSpecificLabels(): string[] {
  return TYPE_SPECIFIC_LABELS.filter((label) => screen.queryByLabelText(label) !== null);
}

describe('LoanForm: loan type switching', () => {
  it('starts as a mortgage with its required fields', () => {
    renderForm();
    expect(screen.getByLabelText('Loan type')).toHaveValue('mortgage');
    expect(visibleTypeSpecificLabels()).toEqual(['Property address', 'Down payment ($)']);
  });

  it.each([
    ['personal', ['Loan purpose']],
    ['auto', ['Vehicle VIN']],
    ['mortgage', ['Property address', 'Down payment ($)']],
  ])('mounts exactly the %s fields', async (loanType, expected) => {
    const user = userEvent.setup();
    renderForm();
    await user.selectOptions(screen.getByLabelText('Loan type'), 'auto');

    await user.selectOptions(screen.getByLabelText('Loan type'), loanType);

    expect(visibleTypeSpecificLabels()).toEqual(expected);
  });

  it('posts only the fields of the selected loan type', async () => {
    const user = userEvent.setup();
    const { form } = renderForm();

    await user.selectOptions(screen.getByLabelText('Loan type'), 'personal');

    expect([...new FormData(form).keys()].sort()).toEqual(
      [
        'annualIncome',
        'creditScore',
        'employmentStatus',
        'loanAmount',
        'loanPurpose',
        'loanType',
        'monthlyDebt',
        'termMonths',
      ].sort(),
    );
  });

  it('resets the term to the new type default when switching type', async () => {
    const user = userEvent.setup();
    renderForm();
    expect(screen.getByLabelText('Loan term (months)')).toHaveValue(360);

    await user.selectOptions(screen.getByLabelText('Loan type'), 'auto');

    expect(screen.getByLabelText('Loan term (months)')).toHaveValue(60);
  });
});

describe('LoanForm: server state', () => {
  const errorState: FormState = {
    status: 'error',
    fieldErrors: { vehicleVin: ['VIN must be 17 letters or digits (I, O and Q are not allowed)'] },
    submittedValues: { loanType: 'auto', loanAmount: '42000', vehicleVin: 'BAD-VIN' },
  };

  it('restores the submitted loan type and values', () => {
    renderForm(errorState);
    expect(screen.getByLabelText('Loan type')).toHaveValue('auto');
    expect(screen.getByLabelText('Loan amount ($)')).toHaveValue(42000);
    expect(screen.getByLabelText('Vehicle VIN')).toHaveValue('BAD-VIN');
  });

  it('marks invalid fields and links them to their error message', () => {
    renderForm(errorState);
    const vin = screen.getByLabelText('Vehicle VIN');

    expect(vin).toHaveAttribute('aria-invalid', 'true');
    expect(vin).toHaveAccessibleDescription(
      'VIN must be 17 letters or digits (I, O and Q are not allowed)',
    );
    expect(screen.getByLabelText('Loan amount ($)')).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByText(/some fields need attention/i)).toBeInTheDocument();
  });

  it('hides errors of the submitted type after switching to another type', async () => {
    const user = userEvent.setup();
    renderForm(errorState);

    await user.selectOptions(screen.getByLabelText('Loan type'), 'personal');

    expect(screen.queryByText(/VIN must be/)).not.toBeInTheDocument();
    expect(screen.queryByText(/some fields need attention/i)).not.toBeInTheDocument();
  });
});
