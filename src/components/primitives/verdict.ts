import type { Verdict } from "../../types/domain";

export const VERDICT_GLYPH: Record<Verdict, string> = {
  Aligned: "=",
  Partial: "≈",
  Misaligned: "≠",
  Unrelated: "·",
};

export const VERDICT_ORDER: Verdict[] = ["Misaligned", "Partial", "Unrelated", "Aligned"];

export function verdictColorClass(verdict: Verdict): { text: string; tint: string; bar: string } {
  const key = verdict.toLowerCase();
  return {
    text: `text-verdict-${key}`,
    tint: `bg-verdict-${key}-tint`,
    bar: `bg-verdict-${key}`,
  };
}
