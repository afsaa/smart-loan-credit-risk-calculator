import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SubmitButton } from '@/components/form/SubmitButton';

function neverSettles(): Promise<void> {
  return new Promise<void>(() => undefined);
}

describe('SubmitButton', () => {
  it('is enabled with the idle label when the form is not submitting', () => {
    render(
      <form action={neverSettles}>
        <SubmitButton />
      </form>,
    );

    const button = screen.getByRole('button', { name: 'Calculate Risk & Schedule' });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-disabled', 'false');
  });

  it('is disabled and relabelled while the parent form action is pending', async () => {
    const user = userEvent.setup();
    render(
      <form action={neverSettles}>
        <SubmitButton />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Calculate Risk & Schedule' }));

    const button = await screen.findByRole('button', { name: 'Calculating...' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});
