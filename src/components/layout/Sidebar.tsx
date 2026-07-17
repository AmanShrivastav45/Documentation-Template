// Left navigation: search box + recursive doc tree. Branches expand/collapse,
// the active page's ancestors auto-expand, and searching filters by title.
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ancestorsOf, docTree, filterTree, type DocNode } from "@/lib/docs";
import SearchBox from "@/components/layout/SearchBox";
import TreeNode from "@/components/layout/TreeNode";

export default function Sidebar() {
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(ancestorsOf(pathname).map((n) => n.path)),
  );

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      ancestorsOf(pathname).forEach((n) => next.add(n.path));
      return next;
    });
  }, [pathname]);

  const tree = useMemo(() => filterTree(docTree, query), [query]);
  const searching = query.trim().length > 0;

  const toggle = (path: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-r border-line bg-panel dark:border-line-dark dark:bg-panel-dark">
      <div className="shrink-0 p-4 pb-3">
        <SearchBox value={query} onChange={setQuery} />
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-6" aria-label="Documentation">
        {tree.length === 0 ? (
          <p className="px-3 py-2 text-sm text-soft dark:text-soft-dark">No matches.</p>
        ) : (
          tree.map((node: DocNode) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              expanded={expanded}
              forceOpen={searching}
              onToggle={toggle}
            />
          ))
        )}
      </nav>
    </aside>
  );
}
