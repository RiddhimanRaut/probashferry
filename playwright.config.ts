import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.CI ? 3000 : 3001;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "iPhone 14",
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "iPhone SE",
      use: { ...devices["iPhone SE"] },
    },
    {
      name: "Pixel 7",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"], hasTouch: true },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
