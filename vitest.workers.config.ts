import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: "./wrangler.toml" },
			miniflare: {
				bindings: { API_TOKEN: "test-token" },
			},
		}),
	],
	test: {
		include: ["src/server/**/*.test.ts"],
	},
});
