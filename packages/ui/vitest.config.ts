import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [import("@vitejs/plugin-react").then((mod) => mod.default())],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test-setup.ts"],
  },
});
