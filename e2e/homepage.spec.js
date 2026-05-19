// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Homepage", () => {
  test("loads with Greif branding", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Greif/i);
    await expect(page.locator(".logo")).toContainText("GREIF");
    await expect(page.locator("h1")).toContainText(/packaging solutions/i);
  });

  test("mobile menu toggles", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const toggle = page.locator(".nav-toggle");
    await toggle.click();
    await expect(page.locator(".main-nav")).toHaveClass(/is-open/);
  });
});
