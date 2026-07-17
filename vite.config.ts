import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import docsMeta from "./vite-docs-meta";

// MDX must run before the React plugin so .mdx files reach it as plain JSX.
export default defineConfig({
  plugins: [
    docsMeta(),
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
        providerImportSource: "@mdx-js/react",
      }),
    },
    react(),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
