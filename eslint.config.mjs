import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";

// vinext has no `next` package, so eslint-config-next (which needs Next's Babel parser)
// can't load. Compose the same plugins directly on the typescript-eslint parser.
export default defineConfig([
  globalIgnores([
    ".next/**",
    ".vinext/**",
    ".cloudflare/**",
    ".wrangler/**",
    ".agents/**",
    ".ignore/**", // local prototypes and verification artifacts are not shipped source
    "dist/**",
    "out/**",
    "next-env.d.ts",
    "worker-env.d.ts",
    "docker-entrypoint.js", // legacy Fly.io entrypoint, removed with KAI-9
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  nextPlugin.configs["core-web-vitals"],
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
]);
