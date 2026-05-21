// @ts-check
import { test, expect } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: Static site quality (T1.1 – T1.3)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("T1.1 – Homepage renders correctly", () => {
  test("title contains 'Greif'", async ({ page }) => {
    const resp = await page.goto("/");
    expect(resp?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Greif/i);
  });

  test("top heading is visible and non-empty (h1 or h2)", async ({ page }) => {
    await page.goto("/");
    // index.html uses <h2> for the hero slider, about/products use <h1>
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
    const text = await heading.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test("logo image is visible", async ({ page }) => {
    await page.goto("/");
    const logo = page.locator(".logo img, header img").first();
    await expect(logo).toBeVisible();
  });

  test("main navigation is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav, .main-nav").first()).toBeVisible();
  });

  test("footer is present", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer").first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: All three pages load (T1.2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("T1.2 – All pages return HTTP 200", () => {
  for (const { label, path } of [
    { label: "Homepage",  path: "/"             },
    { label: "About",     path: "/about.html"   },
    { label: "Products",  path: "/products.html" },
  ]) {
    test(`${label} (${path}) returns 200`, async ({ page }) => {
      const resp = await page.goto(path);
      expect(resp?.status()).toBe(200);
    });

    test(`${label} has a visible heading`, async ({ page }) => {
      await page.goto(path);
      // homepage uses h2 (hero slides), about/products use h1
      const heading = page.locator("h1, h2").first();
      await expect(heading).toBeVisible();
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1: Mobile responsive layout (T1.3) — 375 × 667 viewport
// ─────────────────────────────────────────────────────────────────────────────

test.describe("T1.3 – Mobile responsive at 375px", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("page renders without horizontal overflow", async ({ page }) => {
    await page.goto("/");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewWidth + 5); // 5px tolerance
  });

  test("hero heading is readable (font-size >= 18px)", async ({ page }) => {
    await page.goto("/");
    const fontSize = await page.locator("h1, h2").first().evaluate((el) => {
      return parseFloat(getComputedStyle(el).fontSize);
    });
    expect(fontSize).toBeGreaterThanOrEqual(18);
  });

  test("mobile nav toggle button is visible", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator(".nav-toggle, [aria-label*='menu' i], button.hamburger").first();
    await expect(toggle).toBeVisible();
  });

  test("mobile nav toggle opens the navigation menu", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator(".nav-toggle, [aria-label*='menu' i], button.hamburger").first();
    await toggle.click();
    // Wait for any transition
    await page.waitForTimeout(300);
    const nav = page.locator(".main-nav, nav").first();
    // Nav should now be visible or have an open class
    const isVisible = await nav.isVisible();
    const hasOpenClass = await nav.evaluate((el) =>
      el.classList.contains("is-open") ||
      el.classList.contains("open") ||
      el.classList.contains("active") ||
      el.getAttribute("aria-expanded") === "true"
    );
    expect(isVisible || hasOpenClass).toBe(true);
  });

  test("about.html renders at 375px without overflow", async ({ page }) => {
    await page.goto("/about.html");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewWidth + 5);
  });

  test("products.html renders at 375px without overflow", async ({ page }) => {
    await page.goto("/products.html");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewWidth + 5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 (E2E scenarios): T4.1 – generic well-scoped ticket
// These tests verify OUTCOMES of the agent pipeline on the deployed site.
// They are skipped in local development (no PIPELINE_TEST env var set).
// ─────────────────────────────────────────────────────────────────────────────

test.describe("T4 – Post-pipeline verifications (runs in CI only)", () => {
  test.skip(
    !process.env.PIPELINE_TEST,
    "Set PIPELINE_TEST=1 to run post-pipeline verifications"
  );

  test("T4.1 – footer contains Investor Relations link after footer_link pattern", async ({
    page,
  }) => {
    await page.goto("/");
    const link = page.locator('a[href="/investors"]').first();
    await expect(link).toBeVisible();
    await expect(link).toHaveText(/investor/i);
  });

  test("T4.2 – About page contains auto-generated section with list items", async ({
    page,
  }) => {
    await page.goto("/about.html");
    const section = page.locator("section.auto-section").first();
    await expect(section).toBeVisible();
    const items = section.locator("li");
    await expect(items).toHaveCount(3, { timeout: 5000 });
  });

  test("T4.3 – /investors page does not 404 (needs-followup guard)", async ({ page }) => {
    const resp = await page.goto("/investors");
    // Either 200 (page exists) or a redirect; 404 means needs-followup label should be set
    expect(resp?.status()).not.toBe(404);
  });
});
