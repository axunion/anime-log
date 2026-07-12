import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  test: {
    name: "client",
    environment: "happy-dom",
    include: ["src/client/**/*.test.ts"],
  },
});
