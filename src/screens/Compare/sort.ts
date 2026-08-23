import type { FactVerdict } from "../../types/domain";
import { VERDICT_ORDER } from "../../components/primitives/verdict";

export function sortFacts(facts: FactVerdict[]): FactVerdict[] {
  return [...facts].sort((a, b) => {
    const verdictDelta = VERDICT_ORDER.indexOf(a.verdict) - VERDICT_ORDER.indexOf(b.verdict);
    if (verdictDelta !== 0) return verdictDelta;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a.fact_id.localeCompare(b.fact_id);
  });
}
