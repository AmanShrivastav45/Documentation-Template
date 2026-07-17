// One row of the sidebar tree, recursing into children. Branch rows get a
// rotating chevron; the active page gets a pill background and accent bar.
import { NavLink } from "react-router-dom";
import type { DocNode } from "@/lib/docs";

interface TreeNodeProps {
  node: DocNode;
  depth: number;
  expanded: ReadonlySet<string>;
  forceOpen: boolean;
  onToggle: (path: string) => void;
}

const rowBase =
  "relative flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-sm transition-colors";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`shrink-0 text-soft transition-transform duration-200 dark:text-soft-dark ${open ? "rotate-90" : ""}`}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export default function TreeNode({ node, depth, expanded, forceOpen, onToggle }: TreeNodeProps) {
  const isBranch = node.children.length > 0;
  const open = forceOpen || expanded.has(node.path);
  const indent = { paddingLeft: `${10 + depth * 16}px` };

  const label = node.hasPage ? (
    <NavLink
      to={node.path}
      style={indent}
      className={({ isActive }) =>
        `${rowBase} ${
          isActive
            ? "bg-pill font-medium text-ink dark:bg-line-dark dark:text-ink-dark"
            : "text-ink hover:bg-pill/60 dark:text-ink-dark dark:hover:bg-line-dark/60"
        }`
      }
      onClick={() => isBranch && !open && onToggle(node.path)}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-gradient-to-b from-accent to-brandorange" />
          )}
          {isBranch && <Chevron open={open} />}
          <span className="truncate">{node.title}</span>
        </>
      )}
    </NavLink>
  ) : (
    <button
      type="button"
      style={indent}
      onClick={() => onToggle(node.path)}
      className={`${rowBase} text-ink hover:bg-pill/60 dark:text-ink-dark dark:hover:bg-line-dark/60`}
      aria-expanded={open}
    >
      <Chevron open={open} />
      <span className="truncate">{node.title}</span>
    </button>
  );

  return (
    <div>
      {label}
      {isBranch && (
        <div
          className={`grid transition-[grid-template-rows] duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden">
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                forceOpen={forceOpen}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
