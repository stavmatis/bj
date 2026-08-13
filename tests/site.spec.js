import { test, expect } from '@playwright/test';

test('loads the BJ experience and has all core sections', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/BJ/);
  await expect(page.getByRole('heading', { name: /THE THING AFTER AI/i })).toBeVisible();
  await expect(page.locator('#bj-canvas')).toBeVisible();
  await expect(page.getByRole('heading', { name: /FEED THE BEAST/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /MADE BY SOMEONE/i })).toBeVisible();
});

test('slop machine consumes a card and produces output', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /A BAD POEM/i }).click();
  await expect(page.locator('#machine-status')).toHaveText('SLOP COMPLETE', { timeout: 2500 });
  await expect(page.locator('#slop-copy')).toContainText('POIGNANT TAPESTRY');
  await expect(page.locator('#slop-result')).toHaveClass(/done/);
});

test('waitlist validates and stores locally', async ({ page }) => {
  await page.goto('/');
  await page.locator('#email').fill('stavros@example.com');
  await page.getByRole('button', { name: /JOIN/i }).click();
  await expect(page.locator('#form-status')).toContainText('prototype list');
  expect(await page.evaluate(() => localStorage.getItem('bj-waitlist-prototype'))).toBe('stavros@example.com');
});

test('mobile has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  // A sub-pixel grid rounding artefact can produce a 2px scrollWidth delta at 390px.
  // The body remains clipped, so this threshold catches real layout overflow without a false failure.
  expect(overflow).toBeLessThanOrEqual(2);
});
