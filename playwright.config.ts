import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:3000", trace: "on-first-retry" },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 5"], browserName: "chromium" } },
    { name: "tablet", use: { ...devices["Galaxy Tab S4"], browserName: "chromium" } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
