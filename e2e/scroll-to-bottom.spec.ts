import { test, expect, singleTap, goToFirstArticle } from "./fixtures/magazine.fixture";

test.describe("Scroll to bottom button", () => {
  test("button visible when controls shown on article", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    const btn = page.locator('button[aria-label="Scroll to bottom"]');
    await expect(btn).toBeVisible({ timeout: 2000 });
  });

  test("button NOT visible on cover", async ({ magazinePage: page }) => {
    // We're on cover by default — show controls
    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    const btn = page.locator('button[aria-label="Scroll to bottom"]');
    await expect(btn).not.toBeVisible();
  });

  test("clicking button scrolls to bottom", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    // Show controls
    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    const btn = page.locator('button[aria-label="Scroll to bottom"]');
    await expect(btn).toBeVisible({ timeout: 2000 });

    // Use dispatchEvent to trigger the React onClick (bypasses nextjs-portal interception)
    await btn.dispatchEvent("click");

    // Poll until scroll reaches the bottom
    await page.waitForFunction(
      () => {
        const el = document.querySelector(".overflow-y-auto");
        if (!el) return false;
        // Content must be scrollable and we must be near the bottom
        return el.scrollHeight > el.clientHeight &&
          el.scrollTop >= el.scrollHeight - el.clientHeight - 5;
      },
      { timeout: 5000 }
    );
  });
});
