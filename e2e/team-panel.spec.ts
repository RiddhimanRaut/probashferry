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

  test("mosaic tiles visible with 5 members", async ({ magazinePage: page }) => {
    await goToTeamPanel(page);

    // Check for the mosaic grid
    await expect(page.locator('[data-testid="team-mosaic"]')).toBeVisible();

    // Check for each team member tile by name
    await expect(page.locator('[data-testid="team-tile-ananya"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-tile-rahim"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-tile-priya"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-tile-kamal"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-tile-diya"]')).toBeVisible();
  });

  test("tapping a tile opens expanded card", async ({ magazinePage: page }) => {
    await goToTeamPanel(page);

    // Tap the first tile
    await page.locator('[data-testid="team-tile-ananya"]').click();
    await page.waitForTimeout(500);

    // Expanded card should be visible
    await expect(page.locator('[data-testid="team-card"]')).toBeVisible({ timeout: 3000 });
    // Should show the member's name and role
    await expect(page.locator('[data-testid="team-card"]').locator("text=Ananya Roy")).toBeVisible();
    await expect(page.locator('[data-testid="team-card"]').locator("text=Editor-in-Chief")).toBeVisible();
  });

  test("tapping backdrop closes expanded card", async ({ magazinePage: page }) => {
    await goToTeamPanel(page);

    // Open a card
    await page.locator('[data-testid="team-tile-rahim"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="team-card"]')).toBeVisible({ timeout: 3000 });

    // Tap the backdrop to close — click near the top edge where the card isn't covering
    await page.locator('[data-testid="team-backdrop"]').click({ force: true, position: { x: 20, y: 20 } });
    await page.waitForTimeout(500);

    // Card should be gone
    await expect(page.locator('[data-testid="team-card"]')).not.toBeVisible();
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
