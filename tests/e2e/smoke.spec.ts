import { expect, test } from '@playwright/test';

test.describe('home page smoke test', () => {
  test('renders the calculator shell', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Smart Loan & Credit Risk Calculator/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /calculate/i })).toBeVisible();
  });

  test('select fields have no focus ring', async ({ page }) => {
    await page.goto('/');

    const select = page.locator('select[name="loanType"]');
    await select.focus();
    await expect(select).toBeFocused();
    await expect(select).toHaveCSS('box-shadow', 'none');
  });
});
