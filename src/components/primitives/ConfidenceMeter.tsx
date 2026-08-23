import type { Verdict } from "../../types/domain";
import { verdictColorClass } from "./verdict";

export function ConfidenceMeter({ confidence, verdict }: { confidence: number; verdict: Verdict }) {
  const { bar } = verdictColorClass(verdict);
  const pct = Math.round(confidence * 100);
  return (
    <div className="inline-flex items-center gap-sm" aria-label={`Confidence ${confidence.toFixed(2)}`}>
      <div className="w-12 h-[3px] rounded-full bg-hairline overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono font-mono-noliga text-mono-id tabular-nums text-stone">
        {confidence.toFixed(2)}
      </span>
    </div>
  );
}
