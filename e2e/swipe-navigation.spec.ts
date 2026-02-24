import {
  test,
  expect,
  swipeLeft,
  swipeRight,
  goToFirstArticle,
} from "./fixtures/magazine.fixture";

test.describe("Swipe navigation", () => {
  test("swipe left from cover navigates to first article", async ({ magazinePage: page }) => {
    // Cover should be visible (heading "Probashferry")
    await expect(page.locator("h1", { hasText: "Probashferry" })).toBeVisible();

    await swipeLeft(page);
    await page.waitForTimeout(500);

    // Article content should be visible
    await expect(page.locator(".prose")).toBeVisible({ timeout: 5000 });
    // Cover heading should be gone
    await expect(page.locator("h1", { hasText: "Probashferry" })).not.toBeVisible();
  });

  test("swipe right from article navigates back to cover", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);
    await expect(page.locator(".prose")).toBeVisible();

    await swipeRight(page);
    await page.waitForTimeout(500);

    await expect(page.locator("h1", { hasText: "Probashferry" })).toBeVisible({ timeout: 5000 });
  });

  test("cannot swipe past last article", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    // Swipe left many times to reach the end
    for (let i = 0; i < 20; i++) {
      await swipeLeft(page);
      await page.waitForTimeout(300);
    }

    // One more swipe should not crash or change anything
    const contentBefore = await page.locator(".prose").textContent();
    await swipeLeft(page);
    await page.waitForTimeout(300);
    const contentAfter = await page.locator(".prose").textContent();
    expect(contentAfter).toBe(contentBefore);
  });

  test("cannot swipe before cover", async ({ magazinePage: page }) => {
    // We're on the cover — swipe right should do nothing
    await expect(page.locator("h1", { hasText: "Probashferry" })).toBeVisible();

    await swipeRight(page);
    await page.waitForTimeout(300);

    // Still on cover
    await expect(page.locator("h1", { hasText: "Probashferry" })).toBeVisible();
  });

  test("vertical scroll does not trigger horizontal swipe", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    // Dispatch a primarily vertical touch (small dx, large dy)
    const vw = page.viewportSize()!;
    const x = vw.width / 2;
    const y = vw.height / 2;

    // touchstart
    await page.evaluate(
      ({ x, y }) => {
        const target = document.elementFromPoint(x, y) || document.body;
        (window as any).__vertTarget = target;
        const touch = {
          identifier: 0, target, clientX: x, clientY: y,
          pageX: x, pageY: y, screenX: x, screenY: y,
          radiusX: 1, radiusY: 1, rotationAngle: 0, force: 1,
        };
        const list = Object.assign([touch], { item: (i: number) => [touch][i] ?? null });
        const evt = new Event("touchstart", { bubbles: true, cancelable: true });
        Object.defineProperty(evt, "touches", { value: list });
        Object.defineProperty(evt, "changedTouches", { value: list });
        Object.defineProperty(evt, "targetTouches", { value: list });
        target.dispatchEvent(evt);
      },
      { x, y }
    );

    await page.waitForTimeout(50);

    // touchend — primarily vertical movement (dy=200, dx=10)
    await page.evaluate(
      ({ x, y }) => {
        const target = (window as any).__vertTarget || document.body;
        delete (window as any).__vertTarget;
        const touch = {
          identifier: 0, target, clientX: x + 10, clientY: y - 200,
          pageX: x + 10, pageY: y - 200, screenX: x + 10, screenY: y - 200,
          radiusX: 1, radiusY: 1, rotationAngle: 0, force: 1,
        };
        const empty = Object.assign([] as any[], { item: (i: number) => ([] as any[])[i] ?? null });
        const changed = Object.assign([touch], { item: (i: number) => [touch][i] ?? null });
        const evt = new Event("touchend", { bubbles: true, cancelable: true });
        Object.defineProperty(evt, "touches", { value: empty });
        Object.defineProperty(evt, "changedTouches", { value: changed });
        Object.defineProperty(evt, "targetTouches", { value: empty });
        target.dispatchEvent(evt);
      },
      { x, y }
    );

    await page.waitForTimeout(500);

    // Should still be on the article
    await expect(page.locator(".prose")).toBeVisible();
  });
});
