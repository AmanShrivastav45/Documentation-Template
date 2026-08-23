import type { Verdict } from "../../types/domain";

export const VERDICT_GLYPH: Record<Verdict, string> = {
  Aligned: "=",
  Partial: "≈",
  Misaligned: "≠",
  Unrelated: "·",
};

export const VERDICT_ORDER: Verdict[] = ["Misaligned", "Partial", "Unrelated", "Aligned"];

interface VerdictClassSet {
  text: string;
  tint: string;
  bar: string;
}

const VERDICT_CLASSES: Record<Verdict, VerdictClassSet> = {
  Aligned: { text: "text-verdict-aligned", tint: "bg-verdict-aligned-tint", bar: "bg-verdict-aligned" },
  Partial: { text: "text-verdict-partial", tint: "bg-verdict-partial-tint", bar: "bg-verdict-partial" },
  Misaligned: {
    text: "text-verdict-misaligned",
    tint: "bg-verdict-misaligned-tint",
    bar: "bg-verdict-misaligned",
  },
  Unrelated: {
    text: "text-verdict-unrelated",
    tint: "bg-verdict-unrelated-tint",
    bar: "bg-verdict-unrelated",
  },
};

export function verdictColorClass(verdict: Verdict): VerdictClassSet {
  return VERDICT_CLASSES[verdict];
}
