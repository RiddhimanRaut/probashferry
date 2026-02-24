import { Page } from "@playwright/test";

/**
 * Intercept all Firestore REST API calls so tests run without a real backend.
 *
 * GET  → mock article stats (likeCount: 5, commentCount: 2)
 * POST (runQuery for comments) → empty array
 * PATCH / POST / DELETE writes → 200 OK
 */
export async function mockFirestore(page: Page) {
  await page.route("**/firestore.googleapis.com/**", async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    // --- runQuery (used by queryDocs for comments) ---
    if (method === "POST" && url.includes(":runQuery")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ readTime: new Date().toISOString() }]),
      });
    }

    // --- GET reads — return mock article stats ---
    if (method === "GET") {
      // Individual like-check paths (likes/{id}/users/{uid}) → 404
      if (url.includes("/likes/")) {
        return route.fulfill({ status: 404, body: "{}" });
      }
      // Article stats
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          fields: {
            likeCount: { integerValue: "5" },
            commentCount: { integerValue: "2" },
          },
        }),
      });
    }

    // --- Writes (PATCH / POST / DELETE) → success ---
    if (method === "PATCH" || method === "DELETE") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ fields: {} }),
      });
    }

    // POST (addDoc — not runQuery) → return a fake document name
    if (method === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          name: "projects/mock/databases/(default)/documents/mock/doc-" + Date.now(),
          fields: {},
        }),
      });
    }

    // Fallback — let it through (shouldn't happen)
    return route.continue();
  });
}
