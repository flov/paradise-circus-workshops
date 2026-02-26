import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: ["**/.claude/**", ".claude/**"],
  },
  ...coreWebVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
];

export default config;
