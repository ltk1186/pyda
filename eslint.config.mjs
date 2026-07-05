import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      "cloudflare-env.d.ts",
      "next-env.d.ts",
      "node_modules/**",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
