import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Disable ESLint rules that conflict with Prettier (formatting is Prettier's job).
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    // Vendored third-party skill content (pulled verbatim) — not our source.
    ".claude/skills/**",
  ]),
]);

export default eslintConfig;
