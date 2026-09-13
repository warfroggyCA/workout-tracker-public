import { defineConfig, devices } from "@playwright/test";
const port = Number(process.env.WORKOUT_FIELD_FIXES_PORT ?? 3186);
export default defineConfig({
  testDir: "./tests/e2e", testMatch: "froggy-playback.spec.ts",
  outputDir: "output/playwright/workout-field-fixes", fullyParallel: false,
  workers: 1, retries: 0, maxFailures: 1, timeout: 300_000,
  expect: { timeout: 25_000 }, reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${port}`, actionTimeout: 15_000, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `env E2E_PORT=${port} node scripts/run-e2e-server.mjs --production --froggy-form-demo`,
    url: `http://127.0.0.1:${port}/sign-in`, reuseExistingServer: false, timeout: 180_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
  },
});
