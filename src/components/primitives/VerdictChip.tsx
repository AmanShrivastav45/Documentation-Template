import type { Verdict } from "../../types/domain";
import { VERDICT_GLYPH, verdictColorClass } from "./verdict";

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const { text, tint } = verdictColorClass(verdict);
  return (
    <span
      className={`inline-flex items-center gap-xxs h-5 px-sm rounded-sm text-mono-eyebrow uppercase font-mono font-mono-noliga tracking-wide ${text} ${tint}`}
    >
      <span aria-hidden="true">{VERDICT_GLYPH[verdict]}</span>
      {verdict}
    </span>
  );
}
