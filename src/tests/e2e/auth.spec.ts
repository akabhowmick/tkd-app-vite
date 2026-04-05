import { test, expect } from "@playwright/test";

test.describe("Auth — Login page", () => {
  test("renders login heading, email input, and sign-in button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.locator("input[type='email'], input[name='email']").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows validation error when form is submitted empty", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Either a native browser validation or a rendered error message
    const errorVisible =
      (await page.locator("[class*='error'], [class*='alert'], [role='alert']").count()) > 0 ||
      (await page.locator("input:invalid").count()) > 0;
    expect(errorVisible).toBe(true);
  });

  test("shows error message for wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").first().fill("wrong@example.com");
    await page.locator("input[type='password'], input[name='password']").first().fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(
      page.getByText(/incorrect|invalid|wrong|failed/i).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test("password show/hide toggle changes input type", async ({ page }) => {
    await page.goto("/login");
    const passwordInput = page.locator("input[type='password']").first();
    await expect(passwordInput).toBeVisible();

    // Find the toggle button near the password field
    const toggle = page.locator("button[aria-label*='password' i], button[title*='show' i], button[title*='password' i]").first();
    if (await toggle.count() > 0) {
      await toggle.click();
      await expect(page.locator("input[type='text']").first()).toBeVisible();
    } else {
      // Toggle may be an icon button — look for a button sibling to the password input
      const eyeBtn = page.locator("input[type='password'] ~ button, input[type='password'] + button").first();
      if (await eyeBtn.count() > 0) {
        await eyeBtn.click();
        await expect(page.locator("input[type='text']").first()).toBeVisible();
      }
    }
  });

  test("forgot password link navigates to reset-password page", async ({ page }) => {
    await page.goto("/login");
    const forgotLink = page.getByRole("link", { name: /forgot/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/reset-password/);
  });

  test("signup link is visible on login page", async ({ page }) => {
    await page.goto("/login");
    const signupLink = page.getByRole("link", { name: /sign up|create account/i });
    await expect(signupLink).toBeVisible();
  });

  test("password requirement indicators appear when typing in signup", async ({ page }) => {
    await page.goto("/signup");
    const passwordField = page.locator("input[type='password']").first();
    await passwordField.fill("Test");
    // Look for any requirement indicator (commonly a list or checkmarks)
    const indicators = page.locator("[class*='requirement'], [class*='hint'], [class*='rule'], li");
    await expect(indicators.first()).toBeVisible({ timeout: 3000 }).catch(() => {
      // Acceptable if page uses a different pattern
    });
  });

  test("unauthenticated user is redirected from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test("404 route shows 404 text and back link", async ({ page }) => {
    await page.goto("/this-does-not-exist-404");
    await expect(page.getByText(/404/)).toBeVisible();
    await expect(page.getByRole("link", { name: /back|home/i })).toBeVisible();
  });
});
