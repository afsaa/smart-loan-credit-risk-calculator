import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('test harness (jsdom)', () => {
  it('renders React 19 components with jest-dom matchers', () => {
    render(<button type="button">Calculate</button>);
    expect(screen.getByRole('button', { name: 'Calculate' })).toBeInTheDocument();
  });
});
