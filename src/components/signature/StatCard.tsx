import type { Verdict } from "../../types/domain";
import { verdictColorClass } from "../primitives/verdict";

export type StatKey = Verdict | "total";

interface StatCardProps {
  statKey: StatKey;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

const ACTIVE_BORDER: Record<StatKey, string> = {
  total: "border-b-ink",
  Aligned: "border-b-verdict-aligned",
  Partial: "border-b-verdict-partial",
  Misaligned: "border-b-verdict-misaligned",
  Unrelated: "border-b-verdict-unrelated",
};

function colorFor(statKey: StatKey) {
  if (statKey === "total") {
    return { text: "text-ink", tint: "bg-surface-sunken", bar: "bg-ink" };
  }
  return verdictColorClass(statKey);
}

export function StatCard({ statKey, label, count, active, onClick }: StatCardProps) {
  const { text, tint } = colorFor(statKey);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 h-[88px] flex flex-col justify-center gap-xxs px-lg rounded-lg border border-hairline text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        active ? `${tint} border-b-2 ${ACTIVE_BORDER[statKey]}` : "bg-surface-raised"
      }`}
    >
      <span className={`text-stat-xl font-mono font-mono-noliga tabular-nums ${text}`}>{count}</span>
      <span className="text-mono-eyebrow uppercase tracking-wide text-stone font-mono font-mono-noliga">
        {label}
      </span>
    </button>
  );
}
