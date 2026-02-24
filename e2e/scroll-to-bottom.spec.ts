import { test, expect, singleTap, goToFirstArticle } from "./fixtures/magazine.fixture";

test.describe("Scroll toggle button", () => {
  test("at top: only down arrow visible", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    const downBtn = page.locator('button[aria-label="Scroll to bottom"]');
    const upBtn = page.locator('button[aria-label="Scroll to top"]');
    await expect(downBtn).toBeVisible({ timeout: 2000 });
    await expect(upBtn).not.toBeVisible();
  });

  test("mid-scroll: both arrows visible", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    // Scroll to middle
    await page.evaluate(() => {
      const el = document.querySelector("[data-scroll-container]");
      if (el) el.scrollTo({ top: el.scrollHeight / 2, behavior: "instant" });
    });
    await page.waitForTimeout(200);

    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    const downBtn = page.locator('button[aria-label="Scroll to bottom"]');
    const upBtn = page.locator('button[aria-label="Scroll to top"]');
    await expect(downBtn).toBeVisible({ timeout: 2000 });
    await expect(upBtn).toBeVisible({ timeout: 2000 });
  });

  test("at bottom: only up arrow visible", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    // Scroll to bottom
    await page.evaluate(() => {
      const el = document.querySelector("[data-scroll-container]");
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
    });
    await page.waitForTimeout(200);

    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    const upBtn = page.locator('button[aria-label="Scroll to top"]');
    const downBtn = page.locator('button[aria-label="Scroll to bottom"]');
    await expect(upBtn).toBeVisible({ timeout: 2000 });
    await expect(downBtn).not.toBeVisible();
  });

  test("buttons NOT visible on cover", async ({ magazinePage: page }) => {
    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    const downBtn = page.locator('button[aria-label="Scroll to bottom"]');
    const upBtn = page.locator('button[aria-label="Scroll to top"]');
    await expect(downBtn).not.toBeVisible();
    await expect(upBtn).not.toBeVisible();
  });

  test("clicking down arrow scrolls to bottom", async ({ magazinePage: page }) => {
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

    // Re-show controls and verify only up arrow visible
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);
    const upBtn = page.locator('button[aria-label="Scroll to top"]');
    await expect(upBtn).toBeVisible({ timeout: 2000 });
    const downBtn = page.locator('button[aria-label="Scroll to bottom"]');
    await expect(downBtn).not.toBeVisible();
  });

  test("clicking up arrow scrolls to top", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    // Programmatically scroll to bottom
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

    // Re-show controls — only down arrow visible
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);
    const downBtn = page.locator('button[aria-label="Scroll to bottom"]');
    await expect(downBtn).toBeVisible({ timeout: 2000 });
    const upBtnAfter = page.locator('button[aria-label="Scroll to top"]');
    await expect(upBtnAfter).not.toBeVisible();
  });
});
