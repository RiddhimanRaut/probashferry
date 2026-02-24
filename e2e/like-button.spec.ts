import { test, expect, goToFirstArticle } from "./fixtures/magazine.fixture";

test.describe("Like button", () => {
  test.beforeEach(async ({ magazinePage }) => {
    await goToFirstArticle(magazinePage);
  });

  test("like button shows auth prompt when not signed in", async ({ magazinePage: page }) => {
    const likeBtn = page.locator('button[aria-label="Like"]');
    await likeBtn.scrollIntoViewIfNeeded();
    await likeBtn.click({ force: true });

    // Auth prompt should appear
    await expect(page.locator("text=Sign in to continue")).toBeVisible({ timeout: 3000 });
    await expect(page.locator("text=Sign in with Google")).toBeVisible();
  });

  test("auth prompt dismiss works", async ({ magazinePage: page }) => {
    const likeBtn = page.locator('button[aria-label="Like"]');
    await likeBtn.scrollIntoViewIfNeeded();
    await likeBtn.click({ force: true });

    await expect(page.locator("text=Sign in to continue")).toBeVisible({ timeout: 3000 });

    // Click "Not now" to dismiss
    await page.locator("text=Not now").click();
    await expect(page.locator("text=Sign in to continue")).not.toBeVisible({ timeout: 2000 });
  });

  test("like count from mocked API displays", async ({ magazinePage: page }) => {
    // The mock returns likeCount: 5 — wait for polling to pick it up.
    // The like button's span shows the count with tabular-nums class.
    const likeBtn = page.locator('button[aria-label="Like"]');
    await likeBtn.scrollIntoViewIfNeeded();

    // Wait for the like count to appear inside the like button
    await expect(likeBtn.locator("span")).toHaveText("5", { timeout: 10000 });
  });
});
