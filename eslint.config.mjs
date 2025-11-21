// eslint.config.mjs — Flat config, ESLint 9, monorepo influence

import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    // Ignorer les dossiers de build + forge
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "forge.config.js",
      "out/**",
    ],
  },

  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tseslint.parser, // OK → tseslint expose bien parser maintenant
      parserOptions: {
        ecmaFeatures: { jsx: true },

        // ⛔ ATTENTION : on désactive le type-check au pre-commit
        project: null,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: pluginReact,
    },

    rules: {
      ...tseslint.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,

      // Pas nécessaire avec React 17+
      "react/react-in-jsx-scope": "off",

      // Améliore la DX
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },

    settings: {
      react: { version: "detect" },
    },
  },

  // Prettier doit TOUJOURS finir la configuration
  eslintConfigPrettier,
];
