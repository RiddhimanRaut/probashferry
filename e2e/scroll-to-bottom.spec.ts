import { test, expect, singleTap, goToFirstArticle } from "./fixtures/magazine.fixture";

test.describe("Scroll toggle button", () => {
  test("button visible when controls shown on article", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    const btn = page.locator('button[aria-label="Scroll to bottom"]');
    await expect(btn).toBeVisible({ timeout: 2000 });
  });

  test("button NOT visible on cover", async ({ magazinePage: page }) => {
    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    const btn = page.locator('button[aria-label="Scroll to bottom"]');
    await expect(btn).not.toBeVisible();
  });

  test("clicking button scrolls to bottom and flips to up arrow", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    const btn = page.locator('button[aria-label="Scroll to bottom"]');
    await expect(btn).toBeVisible({ timeout: 2000 });
    await btn.dispatchEvent("click");

    // Wait for scroll to reach bottom
    await page.waitForFunction(
      () => {
        const el = document.querySelector("[data-scroll-container]");
        if (!el) return false;
        return el.scrollHeight > el.clientHeight &&
          el.scrollTop >= el.scrollHeight - el.clientHeight - 5;
      },
      { timeout: 5000 }
    );

    // Re-show controls and verify button flipped to up arrow
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);
    const upBtn = page.locator('button[aria-label="Scroll to top"]');
    await expect(upBtn).toBeVisible({ timeout: 2000 });
  });

  test("up arrow scrolls back to top and flips to down arrow", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    // Programmatically scroll to bottom (skip the button for setup)
    await page.evaluate(() => {
      const el = document.querySelector("[data-scroll-container]");
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
    });
    await page.waitForTimeout(200);

    // Show controls — button should be "Scroll to top"
    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    const upBtn = page.locator('button[aria-label="Scroll to top"]');
    await expect(upBtn).toBeVisible({ timeout: 2000 });
    await upBtn.dispatchEvent("click");

    // Wait for scroll to reach top
    await page.waitForFunction(
      () => {
        const el = document.querySelector("[data-scroll-container]");
        if (!el) return false;
        return el.scrollTop <= 5;
      },
      { timeout: 5000 }
    );

    // Re-show controls — button should be back to "Scroll to bottom"
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);
    const downBtn = page.locator('button[aria-label="Scroll to bottom"]');
    await expect(downBtn).toBeVisible({ timeout: 2000 });
  });
});
