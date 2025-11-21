import { defineConfig } from "@playwright/test";
import { resolve } from "path";

const PORT = process.env.PORT || 3000; // Ensure consistency with server port

export default defineConfig({
  testDir: "./src/__tests__/e2e", // Directory for E2E tests
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    trace: "on-first-retry",
    // Provide the path to the Electron executable, relative to the project root
    // This assumes electron-vite build output is in 'dist-app'
    launchOptions: {
      executablePath: resolve(__dirname, "dist-app/main.js"), // Path to your Electron main process
      args: ["."], // Pass current directory as argument if needed
    },
  },

  // Configure projects for different environments (e.g., development, CI)
  projects: [
    {
      name: "electron",
      testMatch: "**/*.spec.ts",
    },
  ],

  // Web server for the API, if tests need to interact with it
  webServer: {
    command: `npm run dev --workspace=apps/server`, // Command to start your local API server
    url: `http://localhost:${PORT}`,
    timeout: 30 * 1000, // 30 seconds
    reuseExistingServer: !process.env.CI, // Reuse server in dev, start new in CI
  },
});
