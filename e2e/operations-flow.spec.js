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

  test('answers a volunteer protocol question in the Copilot tab', async ({ page }) => {
    await enterAsOperations(page);
    await page.getByRole('tab', { name: /copilot/i }).click();
    await page.getByLabel(/ask the protocol assistant/i).fill('a child is lost near Gate 3');
    await page.getByRole('button', { name: /^send$/i }).click();
    await expect(page.getByText(/Guest Services/i)).toBeVisible();
  });

  test('pings nearby volunteers for dynamic re-routing', async ({ page }) => {
    await enterAsOperations(page);
    await page.getByRole('tab', { name: /copilot/i }).click();
    await page.getByRole('button', { name: /ping nearby volunteers/i }).click();
    await expect(page.getByText(/brief sent/i)).toBeVisible();
  });

  test('summarizes multi-source reports in the Incident Command tab', async ({ page }) => {
    await enterAsOperations(page);
    await page.getByRole('tab', { name: /incident command/i }).click();
    await page.getByRole('button', { name: /summarize with ai/i }).click();
    await expect(page.getByText(/consistent across security, volunteer/i)).toBeVisible();
  });

  test('generates an automated PA announcement', async ({ page }) => {
    await enterAsOperations(page);
    await page.getByRole('tab', { name: /incident command/i }).click();
    await page.getByRole('button', { name: /generate announcement/i }).click();
    await expect(page.getByText(/for a faster exit, please use concourse s/i)).toBeVisible();
  });

  test('simulates a transit delay and auto-generates AI wayfinding + signage guidance', async ({ page }) => {
    await enterAsOperations(page);
    await page.getByRole('tab', { name: /egress/i }).click();
    await page.getByRole('button', { name: /simulate transit delay/i }).click();
    await expect(page.getByText(/wayfinding updated to pace attendees toward zócalo fan fest/i)).toBeVisible();
    await expect(page.getByText(/metro delayed — wait at zócalo fan fest/i)).toBeVisible();
  });

  test('the simulated transit delay updates the attendee Transport tab live, in the same session', async ({ page }) => {
    await enterAsOperations(page);
    await page.getByRole('tab', { name: /egress/i }).click();
    await page.getByRole('button', { name: /simulate transit delay/i }).click();
    await expect(page.getByText(/digital signage preview/i)).toBeVisible();

    await page.getByRole('button', { name: /switch role/i }).click();
    await page.getByRole('button', { name: /boy avatar/i }).click();
    await page.getByLabel(/your name/i).fill('Leo');
    await page.getByLabel(/ticket id/i).fill('WC26-118014');
    await page.getByRole('button', { name: /enter the stadium/i }).click();
    await expect(page.getByText('Hey, Leo')).toBeVisible();

    await page.getByRole('tab', { name: /transport/i }).click();
    await expect(page.getByText(/egress optimizer:/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /metro — blue line/i })).toContainText(/delayed 12 min/i);
  });

  test('shows the tournament operations briefing for organizers', async ({ page }) => {
    await enterAsOperations(page);
    await page.getByRole('tab', { name: /tournament intel/i }).click();
    await expect(page.getByText('Gate 4', { exact: true })).toBeVisible();
    await expect(page.getByText('Ice Cream Co.', { exact: true })).toBeVisible();
    await expect(page.getByText(/pre-position an extra marshal at gate 4/i)).toBeVisible();
  });
});
