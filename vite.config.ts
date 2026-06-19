import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const shared = resolve(__dirname, "src/shared");

export default defineConfig({
  root: "src/client",
  resolve: {
    alias: {
      "@shared": shared,
    },
  },
  plugins: [
    vue(),
    cloudflare({
      configPath: resolve(__dirname, "wrangler.toml"),
      persistState: { path: resolve(__dirname, ".wrangler/state") },
    }),
  ],
  css: {
    transformer: "lightningcss",
  },
  build: {
    outDir: resolve(__dirname, "dist"),
    cssMinify: "lightningcss",
  },
  environments: {
    client: {
      build: {
        outDir: resolve(__dirname, "dist/client"),
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: resolve(__dirname, "src/client/index.html"),
            admin: resolve(__dirname, "src/client/admin.html"),
          },
        },
      },
    },
  },
});
