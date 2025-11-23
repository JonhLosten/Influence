import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["../../tests/setupNodeTests.ts"], // Shared setup for Node environment
    exclude: [
      "node_modules/",
      "drizzle/", // Exclude migration files
    ],
    include: ["src/**/*.test.ts"], // Only include test files from the src directory
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "drizzle/",
        "src/migrate.ts", // Exclude migration script from coverage
        "src/seed.ts", // Exclude seed script from coverage
      ],
    },
  },
});
