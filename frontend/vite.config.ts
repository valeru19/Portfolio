import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

import { htmlSeoPlugin } from "./vite-plugins/htmlSeo";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  // Expose to the SEO plugin (transformIndexHtml runs in Node).
  if (env.VITE_SITE_URL) process.env.VITE_SITE_URL = env.VITE_SITE_URL;
  if (env.VITE_API_BASE !== undefined) process.env.VITE_API_BASE = env.VITE_API_BASE;

  return {
    base: "/Portfolio/",
    plugins: [react(), htmlSeoPlugin(rootDir)],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "src"),
      },
    },
    server: {
      port: 3000,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/shared/lib/test/setup.ts"],
      css: true,
    },
  };
});

