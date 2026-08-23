import { useState } from "react";
import type { Verdict } from "../../types/domain";
import { VERDICT_GLYPH } from "../primitives/verdict";

interface FactOption {
  factId: string;
  qualifiedName: string;
  verdict?: Verdict;
}

interface FactMultiselectProps {
  facts: FactOption[];
  selected: string[] | null;
  onChange: (ids: string[] | null) => void;
}

export function FactMultiselect({ facts, selected, onChange }: FactMultiselectProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const triggerLabel =
    selected === null ? "All facts" : `${selected.length} fact${selected.length === 1 ? "" : "s"} selected`;

  const visible = facts.filter(
    (f) =>
      f.qualifiedName.toLowerCase().includes(filter.toLowerCase()) ||
      f.factId.toLowerCase().includes(filter.toLowerCase())
  );

  function toggle(factId: string) {
    const current = selected ?? [];
    const next = current.includes(factId) ? current.filter((id) => id !== factId) : [...current, factId];
    onChange(next.length === 0 ? null : next);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="h-9 px-md rounded-md border border-hairline-strong bg-canvas text-body-md text-ink"
      >
        {triggerLabel}
      </button>
      {open && (
        <div className="absolute z-30 mt-xs w-80 max-h-96 overflow-auto rounded-lg border border-hairline bg-surface-raised shadow-pop p-sm">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter facts"
            className="w-full h-8 px-sm mb-sm rounded-sm border border-hairline-strong bg-canvas text-body-sm"
          />
          {visible.map((f) => (
            <label key={f.factId} className="flex items-center gap-sm px-sm py-xs hover:bg-surface rounded-sm">
              <input
                type="checkbox"
                checked={(selected ?? []).includes(f.factId)}
                onChange={() => toggle(f.factId)}
              />
              <span className="font-mono font-mono-noliga text-mono-id text-stone">{f.factId}</span>
              <span className="flex-1 truncate text-body-sm text-ink">{f.qualifiedName}</span>
              {f.verdict && <span aria-hidden="true">{VERDICT_GLYPH[f.verdict]}</span>}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
