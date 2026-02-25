import {
  test,
  expect,
  swipeLeft,
  singleTap,
  goToFirstArticle,
} from "./fixtures/magazine.fixture";

/** Navigate to the team panel by swiping past all articles. */
async function goToTeamPanel(page: import("@playwright/test").Page) {
  await goToFirstArticle(page);
  // Swipe left enough times to pass all articles and land on team
  for (let i = 0; i < 20; i++) {
    await swipeLeft(page);
    await page.waitForTimeout(300);
  }
  await page.waitForSelector('[data-testid="team-panel"]', { timeout: 10000 });
}

test.describe("Team Panel", () => {
  test("team page reachable by swiping past last article", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    // Swipe left many times to get past all articles to the team page
    for (let i = 0; i < 20; i++) {
      await swipeLeft(page);
      await page.waitForTimeout(300);
    }

    // Team panel should be visible
    await expect(page.locator('[data-testid="team-panel"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Meet The Team")).toBeVisible();
  });

  test("polaroid tiles visible with 5 members", async ({ magazinePage: page }) => {
    await goToTeamPanel(page);

    // Check for each team member polaroid tile by name
    await expect(page.locator('[data-testid="team-tile-riddhiman"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-tile-abhipsha"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-tile-ritoja"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-tile-srijan"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-tile-pratyusha"]')).toBeVisible();
  });

  test("tapping polaroid flips to bio", async ({ magazinePage: page }) => {
    await goToTeamPanel(page);

    // Tap the first polaroid
    await page.locator('[data-testid="team-tile-riddhiman"]').click();
    await page.waitForTimeout(500);

    // Back face (bio card) should be visible
    const cards = page.locator('[data-testid="team-card"]');
    const riddhimanCard = cards.filter({ hasText: "Riddhiman" });
    await expect(riddhimanCard).toBeVisible({ timeout: 3000 });
    await expect(riddhimanCard.locator("text=Editor-in-Chief")).toBeVisible();
  });

  test("tapping flipped card flips back", async ({ magazinePage: page }) => {
    await goToTeamPanel(page);

    // Flip a card open
    await page.locator('[data-testid="team-tile-abhipsha"]').click();
    await page.waitForTimeout(500);

    const abhipshaCard = page.locator('[data-testid="team-card"]').filter({ hasText: "Abhipsha" });
    await expect(abhipshaCard).toBeVisible({ timeout: 3000 });

    // Tap the same polaroid area again to flip back
    await abhipshaCard.click();
    await page.waitForTimeout(500);

    // Bio card should no longer be visible (face-down)
    await expect(abhipshaCard).not.toBeVisible();
  });

  test("TOC shows Meet The Team entry and navigates to it", async ({ magazinePage: page }) => {
    await goToFirstArticle(page);

    const vw = page.viewportSize()!;

    // Single-tap to show controls
    await singleTap(page, vw.width / 2, vw.height / 2);
    await page.waitForTimeout(600);

    // Open TOC
    const tocBtn = page.locator('button[aria-label="Table of contents"]');
    await expect(tocBtn).toBeVisible({ timeout: 2000 });
    await tocBtn.click();

    // "Meet The Team" entry should be visible in TOC
    const teamEntry = page.locator('[data-testid="toc-team-entry"]');
    await expect(teamEntry).toBeVisible({ timeout: 3000 });

    // Click via JS dispatch — avoids nextjs-portal interception on small screens
    await teamEntry.dispatchEvent("click");
    await page.waitForTimeout(500);

    // Should navigate to team panel
    await expect(page.locator('[data-testid="team-panel"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h2:has-text("Meet The Team")')).toBeVisible();
  });
});
