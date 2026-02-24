import { test, expect, goToFirstArticle } from "./fixtures/magazine.fixture";

test.describe("Comments section", () => {
  test.beforeEach(async ({ magazinePage }) => {
    await goToFirstArticle(magazinePage);
  });

  test("comment button toggles comments section", async ({ magazinePage: page }) => {
    const commentBtn = page.locator('button[aria-label="Toggle comments"]');
    await commentBtn.scrollIntoViewIfNeeded();

    // Comments section should not be visible initially
    await expect(page.locator("text=Be the first to comment")).not.toBeVisible();

    // Click to open
    await commentBtn.click({ force: true });

    // The comments section renders below the button — scroll it into view
    const commentSection = page.locator("text=Be the first to comment");
    await expect(commentSection).toBeVisible({ timeout: 10000 });

    // Click to close
    await commentBtn.scrollIntoViewIfNeeded();
    await commentBtn.click({ force: true });
    await expect(page.locator("text=Be the first to comment")).not.toBeVisible();
  });
});
