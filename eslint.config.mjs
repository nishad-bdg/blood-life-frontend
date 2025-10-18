// eslint.config.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Next.js + TS + Prettier presets (flat-compat)
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),

  // 1) Global ignores so ESLint does NOT lint Next build artifacts
  {
    ignores: [
      "node_modules/**",
      ".next/**",            // <— important
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "next-env.d.ts",
    ],
  },

  // 2) Default rules for everything (JS/TS) — turn OFF type-aware rules here
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Disable any type-aware rules globally (they’ll be re-enabled below for typed files)
      "@typescript-eslint/await-thenable": "off",
    },
  },

  // 3) Typed linting ONLY for your source TS files
  //    This gives ESLint the TS program (from your tsconfig)
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: [path.resolve(__dirname, "./tsconfig.json")],
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },
    },
    rules: {
      // Re-enable the type-aware rules *only* where we have type info
      "@typescript-eslint/await-thenable": "error",
    },
  },
];
