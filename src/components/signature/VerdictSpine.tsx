import type { Verdict } from "../../types/domain";
import { VERDICT_GLYPH, verdictColorClass } from "../primitives/verdict";

export function VerdictSpine({ verdict, confidence }: { verdict: Verdict; confidence: number }) {
  const { text, tint, bar } = verdictColorClass(verdict);
  return (
    <div className={`relative w-full min-[900px]:w-14 h-11 min-[900px]:h-auto shrink-0 ${tint}`}>
      <div
        className={`absolute ${bar} min-[900px]:left-1/2 min-[900px]:-translate-x-1/2 min-[900px]:top-0 min-[900px]:bottom-0 min-[900px]:w-1 min-[900px]:h-auto left-0 right-0 top-1/2 -translate-y-1/2 h-1 w-auto`}
      />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex min-[900px]:flex-col flex-row items-center gap-xs min-[900px]:gap-xxs">
        <div className={`h-7 w-7 rounded-xs flex items-center justify-center ${bar} text-on-accent`} aria-hidden="true">
          {VERDICT_GLYPH[verdict]}
        </div>
        <div
          className={`text-mono-eyebrow uppercase tracking-wide font-mono font-mono-noliga ${text} min-[900px]:[writing-mode:vertical-rl] min-[900px]:rotate-180`}
        >
          {verdict}
        </div>
        <div className="text-mono-id tabular-nums font-mono font-mono-noliga text-stone">
          {confidence.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
