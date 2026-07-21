import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  cssVarsPrefix: "ccg",
  globalCss: {
    "html, body": {
      bg: "gray.50",
      color: "gray.900",
      lineHeight: "1.6",
    },
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#f0f9ff" },
          100: { value: "#e0f2fe" },
          500: { value: "#8b5cf6" },
          600: { value: "#8b5cf6" },
          700: { value: "#8b5cf6" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
