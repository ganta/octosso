import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  publicDir: "public",
  build: {
    outDir: "dist",
    minify: false,
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "content"
            ? "content.js"
            : "assets/[name]-[hash].js";
        },
      },
    },
  },
});
