import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXOpeningElement[name.name='button']",
          message: "Use AppButton only (design system rule). Native <button> is discouraged.",
        },
        {
          selector: "ImportDeclaration[source.value='@/components/ui/button']",
          message: "Use AppButton only (design system rule). shadcn Button is deprecated.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    ".next",
    "out/**",
    "build/**",
    "node_modules/**",
    "next-env.d.ts",
    "public/**",
    "scratch/**",
    ".agent/**",
  ]),
]);

export default eslintConfig;
