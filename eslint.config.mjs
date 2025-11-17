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

  // 1) Global ignores so ESLint does NOT lint Next build artifacts;
