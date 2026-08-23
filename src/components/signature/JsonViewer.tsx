import { useState } from "react";

function JsonNode({ value, path, depth }: { value: unknown; path: string; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (value === null) return <span className="text-code-number">null</span>;
  if (typeof value === "string") return <span className="text-code-string">"{value}"</span>;
  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="text-code-number">{String(value)}</span>;
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  if (entries.length === 0) return <span className="text-code-punct">{isArray ? "[]" : "{}"}</span>;

  return (
    <span>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="text-code-punct font-mono font-mono-noliga hover:text-ink"
        aria-expanded={expanded}
        aria-label={expanded ? `Collapse ${path}` : `Expand ${path}`}
      >
        {expanded ? "▾" : "▸"} {isArray ? "[" : "{"}
      </button>
      {expanded && (
        <div className="pl-md border-l border-hairline ml-xxs">
          {entries.map(([key, val]) => (
            <div key={key}>
              {!isArray && <span className="text-code-keyword">"{key}"</span>}
              {!isArray && <span className="text-code-punct">: </span>}
              <JsonNode value={val} path={`${path}.${key}`} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
      <span className="text-code-punct font-mono font-mono-noliga">{isArray ? "]" : "}"}</span>
    </span>
  );
}

export function JsonViewer({ data }: { data: unknown }) {
  return (
    <pre className="bg-code-bg rounded-lg p-md text-mono-code-sm font-mono font-mono-noliga overflow-auto whitespace-pre-wrap">
      <JsonNode value={data} path="root" depth={0} />
    </pre>
  );
}
