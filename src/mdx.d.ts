// Module shape of every compiled .mdx file: a React component as default
// export plus optional `export const meta` frontmatter used by lib/docs.ts.
declare module "*.mdx" {
  import type { ComponentType } from "react";
  export const meta: { title?: string; order?: number } | undefined;
  const MDXComponent: ComponentType<Record<string, unknown>>;
  export default MDXComponent;
}

// Build-time map of doc file paths to their meta, from the docs-meta plugin.
declare module "virtual:docs-meta" {
  const metaByFile: Record<string, { title?: string; order?: number }>;
  export default metaByFile;
}
