import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (axe-core, WCAG 2.0/2.1 A/AA)', () => {
  test('landing page has no automatically detectable violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('the attendee Navigate tab has no automatically detectable violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /boy avatar/i }).click();
    await page.getByLabel(/your name/i).fill('Leo');
    await page.getByLabel(/ticket id/i).fill('WC26-118014');
    await page.getByRole('button', { name: /enter the stadium/i }).click();
    await expect(page.getByText('Hey, Leo')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('the Ops Console has no automatically detectable violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /operations/i }).click();
    await page.getByLabel(/operations passcode/i).fill('2026');
    await page.getByRole('button', { name: /unlock console/i }).click();
    await expect(page.getByText('Ops Console')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('the Match Hub tab has no automatically detectable violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /boy avatar/i }).click();
    await page.getByLabel(/your name/i).fill('Leo');
    await page.getByLabel(/ticket id/i).fill('WC26-118014');
    await page.getByRole('button', { name: /enter the stadium/i }).click();
    await page.getByRole('tab', { name: /match hub/i }).click();
    await expect(page.getByRole('heading', { name: 'AI commentary' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('the Incident Command tab has no automatically detectable violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: /operations/i }).click();
    await page.getByLabel(/operations passcode/i).fill('2026');
    await page.getByRole('button', { name: /unlock console/i }).click();
    await page.getByRole('tab', { name: /incident command/i }).click();
    await expect(page.getByText('Incident summarizer')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('full onboarding-to-navigate journey is keyboard-only operable', async ({ page }) => {
    await page.goto('/');
    // Skip link -> tab picker -> avatar grid -> name -> ticket -> submit, all via keyboard
    await page.keyboard.press('Tab'); // "Skip to role selection" link
    await page.keyboard.press('Tab'); // Attendee tab
    await page.keyboard.press('Tab'); // Operations tab
    await page.keyboard.press('Tab'); // Boy avatar
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab'); // Girl avatar
    await page.keyboard.press('Tab'); // name input
    await page.keyboard.type('Ava');
    await page.keyboard.press('Tab'); // ticket input
    await page.keyboard.type('WC26-118014');
    await page.keyboard.press('Tab'); // submit button
    await page.keyboard.press('Enter');
    await expect(page.getByText('Hey, Ava')).toBeVisible();
  });

  test('the skip link jumps focus to the main content on activation', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByRole('link', { name: /skip to role selection/i });
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#onboarding-main')).toBeVisible();
  });
});
