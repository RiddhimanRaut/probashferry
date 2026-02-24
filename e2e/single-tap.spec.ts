import { test, expect, singleTap, goToFirstArticle } from "./fixtures/magazine.fixture";

test.describe("Single-tap controls", () => {
  test.beforeEach(async ({ magazinePage }) => {
    await goToFirstArticle(magazinePage);
  });

  test("single tap shows navigation controls", async ({ magazinePage: page }) => {
    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    // Wait for DOUBLE_TAP_WINDOW (400ms) + animation
    await page.waitForTimeout(600);

    // Navigation controls should be visible (page counter like "1 / N")
    await expect(page.locator("text=/\\d+ \\/ \\d+/")).toBeVisible({ timeout: 2000 });
  });

  test("second single tap hides controls", async ({ magazinePage: page }) => {
    const vw = page.viewportSize()!;
    // First tap — show
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);
    await expect(page.locator("text=/\\d+ \\/ \\d+/")).toBeVisible();

    // Second tap — hide
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);
    await expect(page.locator("text=/\\d+ \\/ \\d+/")).not.toBeVisible();
  });

  test("controls auto-hide after 3 seconds", async ({ magazinePage: page }) => {
    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);
    await expect(page.locator("text=/\\d+ \\/ \\d+/")).toBeVisible();

    // Wait for CONTROLS_TIMEOUT (3000ms) + buffer
    await page.waitForTimeout(3500);
    await expect(page.locator("text=/\\d+ \\/ \\d+/")).not.toBeVisible();
  });

  test("controls do NOT show on cover panel", async ({ magazinePage: page }) => {
    // Navigate back to cover via sessionStorage
    await page.evaluate(() => sessionStorage.setItem("probashferry-panel", "0"));
    await page.reload();
    await page.waitForSelector("h1", { timeout: 10000 });

    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    // Controls should NOT appear (onCover = true hides them)
    await expect(page.locator("text=/\\d+ \\/ \\d+/")).not.toBeVisible();
  });
});
