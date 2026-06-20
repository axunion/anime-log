import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.test.toml" },
      miniflare: {
        bindings: { API_TOKEN: "test-token" },
      },
    }),
  ],
  test: {
    include: ["src/server/**/*.test.ts"],
  },
});
