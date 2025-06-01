import { test, expect } = from '@playwright/test';

test('user can log in and navigate to game page', async ({ page }) => {
  // Start at the login page
  await page.goto('http://localhost:3000/login');

  // Fill in login form
  await page.fill('input[type="email"]', 'testuser@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign In")');

  // Wait for home page to load
  await expect(page.locator('text=A daily game')).toBeVisible();

  // Click Play button
  await page.click('text=Play');

  // Wait for game page to load (check for a card title)
  await expect(page.locator('text=Movie B')).toBeVisible();
});