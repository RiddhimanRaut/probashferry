import { test as base, Page, expect } from "@playwright/test";
import { mockFirestore } from "../mock/firestore-mock";

// ---------------------------------------------------------------------------
// Gesture helpers
// ---------------------------------------------------------------------------

interface DoubleTapOptions {
  /** Delay between the two taps in ms (default 80) */
  delay?: number;
  /** Pixel offset for the second tap (default 0 — same spot) */
  offsetX?: number;
  offsetY?: number;
}

/** Two quick touchscreen taps. Configurable delay & offset for proximity tests. */
export async function doubleTap(
  page: Page,
  x: number,
  y: number,
  options: DoubleTapOptions = {}
) {
  const { delay = 80, offsetX = 0, offsetY = 0 } = options;
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(delay);
  await page.touchscreen.tap(x + offsetX, y + offsetY);
}

/** Single touchscreen tap. */
export async function singleTap(page: Page, x: number, y: number) {
  await page.touchscreen.tap(x, y);
}

/**
 * Dispatch a synthetic touch swipe.
 *
 * We dispatch touchstart and touchend as separate evaluate calls with a small
 * gap so React has time to process each event through its delegation system.
 * Uses plain objects and Object.defineProperty to avoid the `new Touch()`
 * constructor which is unavailable in WebKit.
 */
async function dispatchSwipe(
  page: Page,
  startX: number,
  endX: number,
  y: number
) {
  // --- touchstart ---
  await page.evaluate(
    ({ startX, y }) => {
      const target = document.elementFromPoint(startX, y) || document.body;
      // Store target reference so touchend can use the same one
      (window as any).__swipeTarget = target;

      const touch = {
        identifier: 0,
        target,
        clientX: startX,
        clientY: y,
        pageX: startX,
        pageY: y,
        screenX: startX,
        screenY: y,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1,
      };
      const list = Object.assign([touch], {
        item: (i: number) => [touch][i] ?? null,
      });

      const evt = new Event("touchstart", { bubbles: true, cancelable: true });
      Object.defineProperty(evt, "touches", { value: list });
      Object.defineProperty(evt, "changedTouches", { value: list });
      Object.defineProperty(evt, "targetTouches", { value: list });
      target.dispatchEvent(evt);
    },
    { startX, y }
  );

  // Small gap to let React process the touchstart
  await page.waitForTimeout(50);

  // --- touchend ---
  await page.evaluate(
    ({ endX, y }) => {
      const target =
        (window as any).__swipeTarget || document.elementFromPoint(endX, y) || document.body;
      delete (window as any).__swipeTarget;

      const touch = {
        identifier: 0,
        target,
        clientX: endX,
        clientY: y,
        pageX: endX,
        pageY: y,
        screenX: endX,
        screenY: y,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1,
      };
      const emptyList = Object.assign([] as any[], {
        item: (i: number) => ([] as any[])[i] ?? null,
      });
      const changedList = Object.assign([touch], {
        item: (i: number) => [touch][i] ?? null,
      });

      const evt = new Event("touchend", { bubbles: true, cancelable: true });
      Object.defineProperty(evt, "touches", { value: emptyList });
      Object.defineProperty(evt, "changedTouches", { value: changedList });
      Object.defineProperty(evt, "targetTouches", { value: emptyList });
      target.dispatchEvent(evt);
    },
    { endX, y }
  );
}

/**
 * Swipe left — dispatches touchstart + touchend with a large horizontal delta.
 * MagazineViewer only checks start vs end position, no touchmove needed.
 */
export async function swipeLeft(page: Page) {
  const vw = page.viewportSize()!;
  await dispatchSwipe(page, vw.width * 0.8, vw.width * 0.2, vw.height / 2);
}

/** Swipe right — mirror of swipeLeft. */
export async function swipeRight(page: Page) {
  const vw = page.viewportSize()!;
  await dispatchSwipe(page, vw.width * 0.2, vw.width * 0.8, vw.height / 2);
}

/**
 * Navigate to the first article by setting sessionStorage (same key used by
 * useSwipe hook) and reloading. This is the most reliable cross-browser way
 * to get past the cover without depending on touch event dispatch.
 */
export async function goToFirstArticle(page: Page) {
  await page.evaluate(() =>
    sessionStorage.setItem("probashferry-panel", "1")
  );
  await page.reload();
  await page.waitForSelector(".prose", { timeout: 10000 });
}

// ---------------------------------------------------------------------------
// Custom fixture: magazinePage — mocks Firestore + navigates to cover
// ---------------------------------------------------------------------------

type MagazineFixtures = {
  magazinePage: Page;
};

export const test = base.extend<MagazineFixtures>({
  magazinePage: async ({ page }, use) => {
    await mockFirestore(page);
    await page.goto("/");
    // Wait for the cover panel to render (the main heading)
    await page.waitForSelector("h1", { timeout: 10000 });
    await use(page);
  },
});

export { expect };
