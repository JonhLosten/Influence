import { defineConfig, externalizeDepsPlugin, swcPlugin } from "electron-vite";
import { resolve } from "path";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), swcPlugin()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    build: {
      rollupOptions: {
        external: [
          "better-sqlite3",
          "keytar",
          "fluent-ffmpeg",
          "ffmpeg-static",
          "ffprobe-static",
        ], // Externalize native modules
      },
    },
    test: {
      environment: "node",
      globals: true,
      setupFiles: ["../../tests/setupNodeTests.ts"], // Shared setup for Node environment
      exclude: [
        "node_modules/",
        "dist-app/",
        "dist-renderer/",
        "src/main.ts", // Exclude main entry file from unit tests
        "src/squirrel.ts", // Exclude squirrel entry file
      ],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "dist-app/",
          "dist-renderer/",
          "src/main.ts",
          "src/preload.ts",
          "src/squirrel.ts",
        ],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin(), swcPlugin()],
    build: {
      rollupOptions: {
        external: ["electron"], // Externalize Electron for preload
      },
    },
    test: {
      environment: "node",
      globals: true,
      setupFiles: ["../../tests/setupNodeTests.ts"],
      exclude: ["node_modules/", "dist-app/", "dist-renderer/"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: ["node_modules/", "dist-app/", "dist-renderer/"],
      },
    },
  },
  renderer: {
    root: ".",
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "../web/src"), // Alias to web renderer source for shared components
      },
    },
    build: {
      rollupOptions: {
        external: ["electron"],
      },
    },
  },
});
