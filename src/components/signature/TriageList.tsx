import { useRef } from "react";
import type { RefObject } from "react";
import type { FactVerdict } from "../../types/domain";
import { TriageRow } from "./TriageRow";

interface TriageListProps {
  facts: FactVerdict[];
  selectedFactId: string | null;
  onSelectFact: (id: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
}

export function TriageList({
  facts,
  selectedFactId,
  onSelectFact,
  searchValue,
  onSearchChange,
  searchInputRef,
}: TriageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef ?? fallbackRef;

  function moveSelection(delta: 1 | -1) {
    if (facts.length === 0) return;
    const currentIndex = facts.findIndex((f) => f.fact_id === selectedFactId);
    const nextIndex =
      currentIndex === -1 ? 0 : Math.min(facts.length - 1, Math.max(0, currentIndex + delta));
    onSelectFact(facts[nextIndex].fact_id);
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "j" || e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === "k" || e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === "Enter" && selectedFactId) {
      onSelectFact(selectedFactId);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 w-full min-[1600px]:w-[420px] min-[1280px]:w-[380px] min-[1024px]:w-[320px] shrink-0 border-r border-hairline">
      <div className="h-10 shrink-0 sticky top-0 bg-surface flex items-center gap-sm px-md border-b border-hairline">
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by fact_id or qualified_name"
          aria-label="Filter triage list"
          className="flex-1 min-w-0 bg-transparent text-body-sm placeholder:text-faint focus:outline-none"
        />
        <span className="font-mono font-mono-noliga text-mono-id text-stone">{facts.length}</span>
      </div>
      <div
        ref={listRef}
        role="listbox"
        aria-activedescendant={selectedFactId ? `triage-row-${selectedFactId}` : undefined}
        tabIndex={0}
        onKeyDown={onListKeyDown}
        className="flex-1 overflow-auto focus:outline-none"
      >
        {facts.map((fact) => (
          <TriageRow
            key={fact.fact_id}
            id={`triage-row-${fact.fact_id}`}
            fact={fact}
            selected={fact.fact_id === selectedFactId}
            onSelect={() => onSelectFact(fact.fact_id)}
          />
        ))}
      </div>
    </div>
  );
}
