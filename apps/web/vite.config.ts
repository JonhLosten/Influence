import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/main.tsx",
        "src/setupTests.ts",
        "src/schemas.ts", // Exclude Zod schemas from coverage if they are just definitions
        "src/locales/", // Exclude translation files
      ],
    },
  },
});
