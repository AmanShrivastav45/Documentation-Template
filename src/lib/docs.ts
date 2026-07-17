// Auto-discovers every docs/**/*.mdx at build time and builds the sidebar
// tree: folders become branches, files become leaves, index.mdx is a folder's
// page. Contributors never touch this file — just drop .mdx files into docs/.
import type { ComponentType } from "react";
import metaByFile from "virtual:docs-meta";

export interface DocMeta {
  title?: string;
  order?: number;
}

export interface DocNode {
  title: string;
  path: string; // route path, e.g. /architecture/data-flow
  order: number;
  children: DocNode[]; // non-empty = branch (folder)
  hasPage: boolean; // true if a .mdx renders at this path
}

export interface DocRoute {
  path: string;
  load: () => Promise<{ default: ComponentType }>;
}

// Lazy glob feeds React.lazy; titles/ordering come from the docs-meta plugin
// so no doc is ever statically imported and code-splitting stays intact.
const pageModules = import.meta.glob<{ default: ComponentType }>(
  "/docs/**/*.mdx",
);

const UNORDERED = Number.MAX_SAFE_INTEGER;

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function routeFromFile(file: string): string {
  const trimmed = file.slice("/docs".length, -".mdx".length);
  return trimmed.endsWith("/index") ? trimmed.slice(0, -"/index".length) || "/" : trimmed;
}

const root: DocNode = { title: "", path: "/", order: 0, children: [], hasPage: false };
const byPath = new Map<string, DocNode>([["/", root]]);

function ensureBranch(segments: string[]): DocNode {
  let path = "";
  let node = root;
  for (const seg of segments) {
    path += `/${seg}`;
    let child = byPath.get(path);
    if (!child) {
      child = { title: titleFromSlug(seg), path, order: UNORDERED, children: [], hasPage: false };
      byPath.set(path, child);
      node.children.push(child);
    }
    node = child;
  }
  return node;
}

for (const file of Object.keys(pageModules)) {
  const meta: DocMeta | undefined = metaByFile[file];
  const segments = file.slice("/docs/".length, -".mdx".length).split("/");
  const isIndex = segments[segments.length - 1] === "index";
  if (isIndex) {
    const node = ensureBranch(segments.slice(0, -1));
    node.hasPage = true;
    if (meta?.title) node.title = meta.title;
    if (meta?.order !== undefined) node.order = meta.order;
  } else {
    const parent = ensureBranch(segments.slice(0, -1));
    const slug = segments[segments.length - 1];
    const leaf: DocNode = {
      title: meta?.title ?? titleFromSlug(slug),
      path: `/${segments.join("/")}`,
      order: meta?.order ?? UNORDERED,
      children: [],
      hasPage: true,
    };
    byPath.set(leaf.path, leaf);
    parent.children.push(leaf);
  }
}

function sortNodes(nodes: DocNode[]): void {
  nodes.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  nodes.forEach((n) => sortNodes(n.children));
}
sortNodes(root.children);

export const docTree: DocNode[] = root.children;

export const docRoutes: DocRoute[] = Object.entries(pageModules).map(
  ([file, load]) => ({ path: routeFromFile(file), load }),
);

function firstPage(nodes: DocNode[]): string | null {
  for (const node of nodes) {
    if (node.hasPage) return node.path;
    const nested = firstPage(node.children);
    if (nested) return nested;
  }
  return null;
}
export const firstDocPath: string = firstPage(docTree) ?? "/";

// Case-insensitive title filter; a matching branch keeps its whole subtree.
export function filterTree(nodes: DocNode[], query: string): DocNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  return nodes.flatMap((node) => {
    if (node.title.toLowerCase().includes(q)) return [node];
    const children = filterTree(node.children, query);
    return children.length > 0 ? [{ ...node, children }] : [];
  });
}

// Ancestor chain for a route, used by Breadcrumb and Sidebar auto-expand.
export function ancestorsOf(path: string): DocNode[] {
  const segments = path.split("/").filter(Boolean);
  const chain: DocNode[] = [];
  let current = "";
  for (const seg of segments) {
    current += `/${seg}`;
    const node = byPath.get(current);
    if (node) chain.push(node);
  }
  return chain;
}
