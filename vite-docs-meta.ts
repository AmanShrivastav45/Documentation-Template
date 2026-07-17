// Vite plugin exposing "virtual:docs-meta": a map of every docs/**/*.mdx file
// to its `export const meta` (parsed from source, not imported), so the nav
// tree can build without statically importing docs — keeping pages lazy.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { Plugin } from "vite";

const VIRTUAL_ID = "virtual:docs-meta";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

interface Meta {
  title?: string;
  order?: number;
}

function collectMeta(root: string): Record<string, Meta> {
  const docsDir = join(root, "docs");
  const result: Record<string, Meta> = {};
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".mdx")) {
        const source = readFileSync(full, "utf8");
        const block = /export\s+const\s+meta\s*=\s*\{([\s\S]*?)\}/.exec(source)?.[1] ?? "";
        const title = /title\s*:\s*["'`]([^"'`]+)["'`]/.exec(block)?.[1];
        const order = /order\s*:\s*(-?\d+(?:\.\d+)?)/.exec(block)?.[1];
        const key = `/${relative(root, full).split("\\").join("/")}`;
        result[key] = {
          ...(title !== undefined && { title }),
          ...(order !== undefined && { order: Number(order) }),
        };
      }
    }
  };
  walk(docsDir);
  return result;
}

export default function docsMeta(): Plugin {
  let root = process.cwd();
  return {
    name: "docs-meta",
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      return `export default ${JSON.stringify(collectMeta(root))};`;
    },
    configureServer(server) {
      const refresh = (file: string) => {
        if (!file.endsWith(".mdx")) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", refresh);
      server.watcher.on("change", refresh);
      server.watcher.on("unlink", refresh);
    },
  };
}
