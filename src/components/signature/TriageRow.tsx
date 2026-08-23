import type { FactVerdict } from "../../types/domain";
import { VERDICT_GLYPH, verdictColorClass } from "../primitives/verdict";
import { ConfidenceMeter } from "../primitives/ConfidenceMeter";

interface TriageRowProps {
  fact: FactVerdict;
  selected: boolean;
  onSelect: () => void;
  id: string;
}

export function TriageRow({ fact, selected, onSelect, id }: TriageRowProps) {
  const { text, bar } = verdictColorClass(fact.verdict);
  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`relative h-11 min-[1024px]:h-11 max-[1023px]:h-14 flex items-center gap-sm pl-lg pr-lg border-b border-hairline cursor-pointer hover:bg-surface ${
        selected ? "bg-accent-tint" : ""
      }`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${bar}`} />
      {selected && <div className="absolute left-[3px] top-0 bottom-0 w-[2px] bg-accent" />}
      <span className={`font-mono font-mono-noliga ${text}`} aria-hidden="true">
        {VERDICT_GLYPH[fact.verdict]}
      </span>
      <span className="font-mono font-mono-noliga text-mono-id text-stone shrink-0">{fact.fact_id}</span>
      <span dir="rtl" className="flex-1 min-w-0 text-left truncate text-body-md text-ink">
        {fact.qualified_name}
      </span>
      <ConfidenceMeter confidence={fact.confidence} verdict={fact.verdict} />
    </div>
  );
}
