import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    coverage: {
      provider: "v8",
      exclude: [
        "src/components/ui/**",
        "**/*.d.ts",
        "src/types/**",
        "src/tests/**",
        "playwright.config.ts",
        "vite.config.ts",
      ],
    },
  },
});
