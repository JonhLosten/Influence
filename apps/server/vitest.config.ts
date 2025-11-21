import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["../../tests/setupNodeTests.ts", "./src/setupTests.ts"], // Global and server-specific setup
    exclude: [
      "node_modules/",
      "dist/", // Exclude compiled output
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "src/index.ts", // Exclude main entry file from coverage if it's mostly setup
        "src/scheduler.ts", // Exclude scheduler as it's typically integration-tested, not unit-tested for full coverage
        "src/setupTests.ts",
      ],
    },
  },
});
