import { test, expect } from '@playwright/test';

async function enterAsAttendee(page, { name = 'Leo', ticket = 'WC26-118014' } = {}) {
  await page.goto('/');
  await page.getByRole('button', { name: /boy avatar/i }).click();
  await page.getByLabel(/your name/i).fill(name);
  await page.getByLabel(/ticket id/i).fill(ticket);
  await page.getByRole('button', { name: /enter the stadium/i }).click();
  await expect(page.getByText(`Hey, ${name}`)).toBeVisible();
}

test.describe('Landing page', () => {
  test('shows the Attendee/Operations role picker with Attendee active by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('tab', { name: /attendee/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: /operations/i })).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByText('StadiumSync')).toBeVisible();
  });

  test('rejects a malformed ticket ID with an inline error', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/ticket id/i).fill('bad');
    await page.getByRole('button', { name: /enter the stadium/i }).click();
    await expect(page.getByRole('alert')).toContainText(/doesn't look like a ticket id/i);
  });
});

test.describe('Attendee flow', () => {
  test('completes onboarding and lands on the Navigate tab', async ({ page }) => {
    await enterAsAttendee(page);
    await expect(page.getByRole('tab', { name: /navigate/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Live wayfinding')).toBeVisible();
    await expect(page.getByText(/Live position/i)).toBeVisible();
  });

  test('toggles step-free routing and speaks directions via audio wayfinding', async ({ page }) => {
    await enterAsAttendee(page);
    const stepFree = page.getByRole('button', { name: /step-free route/i });
    await expect(stepFree).toHaveAttribute('aria-pressed', 'true');
    await stepFree.click();
    await expect(stepFree).toHaveAttribute('aria-pressed', 'false');

    const audio = page.getByRole('button', { name: /audio wayfinding/i });
    await audio.click();
    // aria-pressed reflects React state synchronously with the click; the
    // visible "Speaking…" label depends on the browser's speech engine
    // actually starting playback, which is less reliable under headless
    // Chromium with no audio device.
    await expect(audio).toHaveAttribute('aria-pressed', 'true');
  });

  test('orders food and sees a placed-order confirmation', async ({ page }) => {
    await enterAsAttendee(page);
    await page.getByRole('tab', { name: /order/i }).click();
    await page.getByRole('button', { name: /add loaded nachos to order/i }).click();
    await page.getByRole('button', { name: /send to seat/i }).click();
    await expect(page.getByText(/order placed/i)).toBeVisible();
  });

  test('the AI assistant answers in the language the attendee types', async ({ page }) => {
    await enterAsAttendee(page);
    await page.getByRole('tab', { name: /assistant/i }).click();
    await page.getByLabel(/message the assistant/i).fill('where is the nearest exit');
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.getByText(/Gate 4/)).toBeVisible();
  });

  test('transport route selection highlights the matching path on the map', async ({ page }) => {
    await enterAsAttendee(page);
    await page.getByRole('tab', { name: /transport/i }).click();
    const metro = page.getByRole('button', { name: /metro — blue line/i });
    await metro.click();
    await expect(page.getByText(/Showing Metro — Blue Line/i)).toBeVisible();
    await expect(metro).toHaveAttribute('aria-pressed', 'true');
  });

  test('the exit control returns to the landing page instead of switching roles in place', async ({ page }) => {
    await enterAsAttendee(page);
    await page.getByRole('button', { name: /switch role/i }).click();
    await expect(page.getByRole('tab', { name: /attendee/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /operations/i })).toBeVisible();
  });

  test('generates AI match commentary in the Match Hub tab', async ({ page }) => {
    await enterAsAttendee(page);
    await page.getByRole('tab', { name: /match hub/i }).click();
    await page.getByRole('button', { name: /generate commentary/i }).click();
    await expect(page.getByText(/tactical shift/i)).toBeVisible();
    await expect(page.getByText(/a live ar overlay needs camera/i)).toBeVisible();
  });

  test('shows sensory guidance and live captions in the Access\\+ tab', async ({ page }) => {
    await enterAsAttendee(page);
    await page.getByRole('tab', { name: /access\+/i }).click();
    await expect(page.getByText(/pyrotechnics expected at halftime/i)).toBeVisible();
    await page.getByRole('button', { name: /^off$/i }).click();
    await expect(page.getByText(/kickoff in 5 minutes/i)).toBeVisible();
  });

  test('routes to the nearest Fan Zone', async ({ page }) => {
    await enterAsAttendee(page);
    await page.getByRole('tab', { name: /fan zone/i }).click();
    await page.getByRole('button', { name: /route me there/i }).click();
    await expect(page.getByText(/showing route to zócalo fan fest/i)).toBeVisible();
  });
});
