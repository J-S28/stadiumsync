import { test, expect } from '@playwright/test';

async function enterAsOperations(page, pin = '2026') {
  await page.goto('/');
  await page.getByRole('tab', { name: /operations/i }).click();
  await page.getByLabel(/operations passcode/i).fill(pin);
  await page.getByRole('button', { name: /unlock console/i }).click();
  await expect(page.getByText('Ops Console')).toBeVisible();
}

test.describe('Operations dashboard', () => {
  test('rejects an incorrect passcode and shows the demo passcode hint', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /operations/i }).click();
    await expect(page.getByText(/demo passcode/i)).toBeVisible();
    await page.getByLabel(/operations passcode/i).fill('0000');
    await page.getByRole('button', { name: /unlock console/i }).click();
    await expect(page.getByRole('alert')).toContainText(/incorrect passcode/i);
  });

  test('unlocks directly into the Ops Console with no ticket required', async ({ page }) => {
    await enterAsOperations(page);
    await expect(page.getByText('Ops Pulse')).toBeVisible();
    await expect(page.getByText('Attendees in venue')).toBeVisible();
  });

  test('deploys crowd marshals from the AI-flagged signal', async ({ page }) => {
    await enterAsOperations(page);
    await page.getByRole('button', { name: /deploy marshals/i }).click();
    await expect(page.getByText(/2 marshals dispatched to gate 4/i)).toBeVisible();
  });

  test('shows vendor stock alerts, including a low-stock warning', async ({ page }) => {
    await enterAsOperations(page);
    await page.getByRole('tab', { name: /vendors/i }).click();
    // "Ice Cream Co." also appears as a Recharts axis label, and hasText
    // matches every ancestor whose combined text includes both strings —
    // .last() picks the innermost (leaf) match, the actual stock-alert row.
    const stockRow = page.locator('div').filter({ hasText: 'Ice Cream Co.' }).filter({ hasText: '12% stock' }).last();
    await expect(stockRow).toBeVisible();
  });

  test('dispatches the collection cart from the sustainability suggestion', async ({ page }) => {
    await enterAsOperations(page);
    await page.getByRole('tab', { name: /sustainability/i }).click();
    await page.getByRole('button', { name: /dispatch cart/i }).click();
    await expect(page.getByText(/collection cart routed to fan zone/i)).toBeVisible();
  });
});
