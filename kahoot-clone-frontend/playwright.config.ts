import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  outputDir: "/tmp/kahoot-playwright-results",
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:3000",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
