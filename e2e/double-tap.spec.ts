import { test, expect, doubleTap, singleTap, goToFirstArticle } from "./fixtures/magazine.fixture";

test.describe("Double-tap gesture", () => {
  test.beforeEach(async ({ magazinePage }) => {
    await goToFirstArticle(magazinePage);
  });

  test("heart SVG appears on double-tap", async ({ magazinePage: page }) => {
    const vw = page.viewportSize()!;
    await doubleTap(page, vw.width / 2, vw.height / 2);
    const heart = page.locator("[style*='z-index: 9999'] svg");
    await expect(heart.first()).toBeVisible({ timeout: 2000 });
  });

  test("heart appears at tap coordinates", async ({ magazinePage: page }) => {
    const x = 100;
    const y = 300;
    await doubleTap(page, x, y);
    const heart = page.locator("[style*='z-index: 9999']").first();
    await expect(heart).toBeVisible({ timeout: 2000 });

    const box = await heart.boundingBox();
    expect(box).toBeTruthy();
    // Heart is rendered at (left: x, top: y) with transform: translate(-50%, …)
    // so the center should be near our tap coordinates
    expect(box!.x + box!.width / 2).toBeCloseTo(x, -1);
  });

  test("proximity within 60px triggers heart", async ({ magazinePage: page }) => {
    const vw = page.viewportSize()!;
    const cx = vw.width / 2;
    const cy = vw.height / 2;
    // Second tap 50px away — within the 60px threshold
    await doubleTap(page, cx, cy, { offsetX: 50, offsetY: 0 });
    await expect(page.locator("[style*='z-index: 9999'] svg").first()).toBeVisible({
      timeout: 2000,
    });
  });

  test("proximity outside 60px does NOT trigger heart", async ({ magazinePage: page }) => {
    const vw = page.viewportSize()!;
    const cx = vw.width / 2;
    const cy = vw.height / 2;
    // Second tap 80px away — outside the 60px threshold
    await doubleTap(page, cx, cy, { offsetX: 80, offsetY: 0 });
    // Wait a moment, then verify no heart appeared
    await page.waitForTimeout(600);
    await expect(page.locator("[style*='z-index: 9999'] svg")).toHaveCount(0);
  });

  test("taps > 400ms apart do NOT trigger double-tap", async ({ magazinePage: page }) => {
    const vw = page.viewportSize()!;
    const cx = vw.width / 2;
    const cy = vw.height / 2;
    // delay longer than DOUBLE_TAP_WINDOW (400ms)
    await doubleTap(page, cx, cy, { delay: 500 });
    await page.waitForTimeout(600);
    await expect(page.locator("[style*='z-index: 9999'] svg")).toHaveCount(0);
  });

  test("button tap does not bridge to content double-tap", async ({ magazinePage: page }) => {
    // Show controls so nav buttons are visible
    const vw = page.viewportSize()!;
    await singleTap(page, vw.width / 2, vw.height / 2);
    // Wait for controls to appear (400ms single-tap delay + render)
    await page.waitForTimeout(600);

    // Tap a navigation button (aria-label="Next")
    const nextBtn = page.locator('button[aria-label="Next"]');
    if (await nextBtn.isVisible()) {
      const btnBox = await nextBtn.boundingBox();
      if (btnBox) {
        await singleTap(page, btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2);
      }
    }

    // Now tap content area quickly — should NOT count as double-tap
    await page.waitForTimeout(100);
    await singleTap(page, vw.width / 2, vw.height / 2);

    await page.waitForTimeout(600);
    await expect(page.locator("[style*='z-index: 9999'] svg")).toHaveCount(0);
  });

  test("rapid triple-tap spawns correct number of hearts", async ({ magazinePage: page }) => {
    const vw = page.viewportSize()!;
    const cx = vw.width / 2;
    const cy = vw.height / 2;
    // Three taps in quick succession: tap-1, tap-2 (double), tap-3 (double with tap-2)
    await page.touchscreen.tap(cx, cy);
    await page.waitForTimeout(120);
    await page.touchscreen.tap(cx, cy);
    await page.waitForTimeout(120);
    await page.touchscreen.tap(cx, cy);

    // At least one heart should appear (the first double-tap between tap 1 & 2)
    const hearts = page.locator("[style*='z-index: 9999'] svg");
    await expect(hearts.first()).toBeVisible({ timeout: 2000 });
    const count = await hearts.count();
    expect(count).toBeGreaterThanOrEqual(1);
    // Should not exceed 2 (one per valid double-tap pair)
    expect(count).toBeLessThanOrEqual(2);
  });

  test("no duplicate heart from synthetic click after touch", async ({
    magazinePage: page,
  }) => {
    const vw = page.viewportSize()!;
    const cx = vw.width / 2;
    const cy = vw.height / 2;
    await doubleTap(page, cx, cy);

    // Simulate the synthetic click that browsers fire after touch events
    await page.evaluate(
      ({ cx, cy }) => {
        const target = document.elementFromPoint(cx, cy) || document.body;
        target.dispatchEvent(
          new MouseEvent("click", { bubbles: true, clientX: cx, clientY: cy })
        );
      },
      { cx, cy }
    );

    await page.waitForTimeout(500);
    // Should have exactly 1 heart, not 2
    const hearts = page.locator("[style*='z-index: 9999'] svg");
    await expect(hearts).toHaveCount(1);
  });
});
