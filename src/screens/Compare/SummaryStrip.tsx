import type { CompareSummary, Verdict } from "../../types/domain";
import { StatCard, type StatKey } from "../../components/signature/StatCard";

interface SummaryStripProps {
  summary: CompareSummary;
  activeFilters: Set<Verdict>;
  onToggleFilter: (v: Verdict) => void;
  onClearFilters: () => void;
}

const CARDS: { key: StatKey; label: string }[] = [
  { key: "total", label: "Total" },
  { key: "Misaligned", label: "Misaligned" },
  { key: "Partial", label: "Partial" },
  { key: "Unrelated", label: "Unrelated" },
  { key: "Aligned", label: "Aligned" },
];

export function SummaryStrip({ summary, activeFilters, onToggleFilter, onClearFilters }: SummaryStripProps) {
  const counts: Record<StatKey, number> = {
    total: summary.total,
    Misaligned: summary.misaligned,
    Partial: summary.partial,
    Unrelated: summary.unrelated,
    Aligned: summary.aligned,
  };

  return (
    <div className="flex gap-md p-lg overflow-x-auto max-md:snap-x max-md:snap-mandatory">
      {CARDS.map((c) => (
        <StatCard
          key={c.key}
          statKey={c.key}
          label={c.label}
          count={counts[c.key]}
          active={c.key === "total" ? activeFilters.size === 0 : activeFilters.has(c.key)}
          onClick={() => (c.key === "total" ? onClearFilters() : onToggleFilter(c.key))}
        />
      ))}
    </div>
  );
}
