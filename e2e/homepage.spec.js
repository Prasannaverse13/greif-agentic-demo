import { test, expect } from "@playwright/test";

test("homepage loads with Greif branding", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Greif/i);
  await expect(page.locator(".logo img")).toBeVisible();
  await expect(page.locator(".hero-slide.is-active h2")).toContainText(/purpose|sustainability|packaging/i);
});

test("mobile menu toggles", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  const toggle = page.locator(".nav-toggle");
  await toggle.click();
  await expect(page.locator(".main-nav")).toHaveClass(/is-open/);
});
