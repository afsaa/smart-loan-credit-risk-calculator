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

test.describe('loan form submission', () => {
  test('a valid mortgage renders the repayment schedule', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Property address').fill('1 Main St, Springfield');
    await page.getByLabel('Down payment ($)').fill('50000');
    await page.getByRole('button', { name: 'Calculate Risk & Schedule' }).click();

    await expect(page.getByRole('heading', { name: 'Repayment Schedule' })).toBeVisible();
    await expect(page.getByLabel('Property address')).toHaveValue('1 Main St, Springfield');
  });

  test('an invalid VIN shows an inline error and keeps the input', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Loan type').selectOption('auto');
    await page.getByLabel('Vehicle VIN').fill('NOT-A-VIN');
    await page.getByRole('button', { name: 'Calculate Risk & Schedule' }).click();

    const vin = page.getByLabel('Vehicle VIN');
    await expect(vin).toHaveAttribute('aria-invalid', 'true');
    await expect(vin).toHaveAccessibleDescription(/VIN must be 17 letters or digits/);
    await expect(vin).toHaveValue('NOT-A-VIN');
    await expect(page.getByRole('heading', { name: 'Repayment Schedule' })).toHaveCount(0);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('a native submit posts to the Server Action and renders field errors', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Property address').fill('1 Main St, Springfield');
    await page.getByRole('button', { name: 'Calculate Risk & Schedule' }).click();

    const downPayment = page.getByLabel('Down payment ($)');
    await expect(downPayment).toHaveAttribute('aria-invalid', 'true');
    await expect(downPayment).toHaveAccessibleDescription('Down payment is required');
    await expect(page.getByLabel('Property address')).toHaveValue('1 Main St, Springfield');
  });
});
