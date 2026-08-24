import type { FactVerdict } from "../../types/domain";
import type { LedgerCode } from "../../components/signature/CompareLedger";

export function buildLedgerCode(fact: FactVerdict, filePath: string): LedgerCode {
  return {
    snippet: fact.discrepancies[0]?.code_location ?? null,
    startLine: 1,
    endLine: 1,
    qualifiedName: fact.qualified_name,
    language: "python",
    filePath,
    factType: fact.fact_type,
  };
}
