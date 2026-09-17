import { defineConfig, devices } from "@playwright/test"
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3101",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: "http://localhost:3101/health",
    reuseExistingServer: false,
    timeout: 120000,
  },
  globalTeardown: "./tests/global-teardown.ts",
})
