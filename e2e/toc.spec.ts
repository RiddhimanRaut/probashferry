import { test, expect, singleTap, goToFirstArticle } from "./fixtures/magazine.fixture";

test.describe("Table of Contents", () => {
  test.beforeEach(async ({ magazinePage }) => {
    await goToFirstArticle(magazinePage);
  });

  /** Helper: show controls then open TOC */
  async function openToc(page: import("@playwright/test").Page) {
    const vw = page.viewportSize()!;
    // Single-tap to show controls
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    // Click the TOC button
    const tocBtn = page.locator('button[aria-label="Table of contents"]');
    await expect(tocBtn).toBeVisible({ timeout: 2000 });
    await tocBtn.click();
  }

  test("TOC opens with article list", async ({ magazinePage: page }) => {
    await openToc(page);

    // The "In This Issue" heading should be visible
    await expect(page.locator("text=In This Issue")).toBeVisible({ timeout: 3000 });

    // Should have at least one article button in the list
    const articleButtons = page.locator(".space-y-1 button");
    await expect(articleButtons.first()).toBeVisible();
    expect(await articleButtons.count()).toBeGreaterThanOrEqual(1);
  });

  test("selecting article navigates to it", async ({ magazinePage: page }) => {
    await openToc(page);

    // Click the first article in the list (always visible without scrolling)
    const articleButtons = page.locator(".space-y-1 button");
    await expect(articleButtons.first()).toBeVisible();
    await articleButtons.first().click();
    await page.waitForTimeout(500);

    // TOC should close
    await expect(page.locator("text=In This Issue")).not.toBeVisible();

    // Article should be displayed (check for prose content)
    await expect(page.locator(".prose")).toBeVisible({ timeout: 5000 });
  });

  test("backdrop tap closes TOC", async ({ magazinePage: page }) => {
    await openToc(page);
    await expect(page.locator("text=In This Issue")).toBeVisible({ timeout: 3000 });

    // The backdrop is at z-40 but the Header at z-50 covers the top.
    // Click near the middle of the viewport where only the backdrop covers.
    const vw = page.viewportSize()!;
    const backdrop = page.locator(".fixed.inset-0.bg-charcoal\\/40");
    await backdrop.click({ force: true, position: { x: vw.width / 2, y: vw.height / 4 } });
    await page.waitForTimeout(500);

    await expect(page.locator("text=In This Issue")).not.toBeVisible();
  });

  test("TOC keeps controls visible (no auto-hide while open)", async ({
    magazinePage: page,
  }) => {
    await openToc(page);
    await expect(page.locator("text=In This Issue")).toBeVisible({ timeout: 3000 });

    // Wait longer than CONTROLS_TIMEOUT (3s)
    await page.waitForTimeout(4000);

    // Controls should still be visible because TOC is open (clears hide timer)
    await expect(page.locator("text=/\\d+ \\/ \\d+/")).toBeVisible();
    await expect(page.locator("text=In This Issue")).toBeVisible();
  });
});
