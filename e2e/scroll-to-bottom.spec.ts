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

  test("clicking button scrolls to bottom", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    const btn = page.locator('button[aria-label="Scroll to bottom"]');
    await expect(btn).toBeVisible({ timeout: 2000 });
    await btn.dispatchEvent("click");

    await page.waitForFunction(
      () => {
        const el = document.querySelector(".overflow-y-auto");
        if (!el) return false;
        return el.scrollHeight > el.clientHeight &&
          el.scrollTop >= el.scrollHeight - el.clientHeight - 5;
      },
      { timeout: 5000 }
    );
  });

  test("button changes to up arrow at bottom, scrolls back to top", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    // Scroll to bottom
    const downBtn = page.locator('button[aria-label="Scroll to bottom"]');
    await expect(downBtn).toBeVisible({ timeout: 2000 });
    await downBtn.dispatchEvent("click");

    // Wait for scroll to reach bottom and button to flip to "Scroll to top"
    const upBtn = page.locator('button[aria-label="Scroll to top"]');
    await expect(upBtn).toBeVisible({ timeout: 5000 });

    // Re-show controls (they may have auto-hidden during scroll wait)
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    // Click "Scroll to top"
    const upBtnAgain = page.locator('button[aria-label="Scroll to top"]');
    await expect(upBtnAgain).toBeVisible({ timeout: 2000 });
    await upBtnAgain.dispatchEvent("click");

    // Poll until scroll reaches the top
    await page.waitForFunction(
      () => {
        const el = document.querySelector(".overflow-y-auto");
        if (!el) return false;
        return el.scrollTop <= 5;
      },
      { timeout: 5000 }
    );
  });
});
