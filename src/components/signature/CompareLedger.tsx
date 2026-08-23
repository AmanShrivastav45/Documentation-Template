import { useEffect, useRef } from "react";
import { CodeBlock } from "./CodeBlock";
import { VerdictSpine } from "./VerdictSpine";
import { MetaBadge } from "../primitives/MetaBadge";
import type { FactVerdict } from "../../types/domain";

export interface LedgerCode {
  snippet: string;
  startLine: number;
  endLine: number;
  qualifiedName: string;
  language: string;
  filePath: string;
  factType: string;
}

interface CompareLedgerProps {
  fact: FactVerdict;
  code: LedgerCode;
  highlightedLocation?: string | null;
}

export function CompareLedger({ fact, code, highlightedLocation }: CompareLedgerProps) {
  const codeColumnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedLocation) {
      codeColumnRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlightedLocation]);

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={`Ledger: ${fact.verdict} verdict for ${fact.qualified_name}, confidence ${fact.confidence}`}
      className="flex flex-col min-h-0"
    >
      <div className="px-lg pt-lg pb-md border-b border-hairline">
        <h2 className="text-title-lg text-ink font-mono font-mono-noliga font-medium truncate">
          {fact.qualified_name}
        </h2>
      </div>
      <div className="flex flex-col min-[900px]:flex-row bg-canvas flex-1 min-h-0">
        <div className="flex-1 min-w-0 min-[900px]:min-w-[340px] flex flex-col min-h-0 border-b min-[900px]:border-b-0 min-[900px]:border-r border-hairline-strong">
          <div className="h-8 shrink-0 sticky top-0 bg-surface flex items-center px-md text-mono-eyebrow uppercase tracking-wide text-stone font-mono font-mono-noliga">
            Model Rule
          </div>
          <div className="flex-1 overflow-auto p-lg flex flex-col gap-md">
            {fact.rule_reference ? (
              <>
                <p className="text-body-lg text-body max-w-[72ch]">{fact.rule_reference.rule_text}</p>
                <p className="text-mono-id font-mono font-mono-noliga text-stone">
                  {fact.rule_reference.document_name} · chunk {fact.rule_reference.chunk_index} · sim{" "}
                  {fact.rule_reference.similarity_score.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="text-body-md text-mute">No matching rule text was found for this fact.</p>
            )}
            <p className="text-body-lg text-ink max-w-[72ch] mt-md">{fact.reasoning}</p>
          </div>
        </div>

        <VerdictSpine verdict={fact.verdict} confidence={fact.confidence} />

        <div
          ref={codeColumnRef}
          className={`flex-1 min-w-0 min-[900px]:min-w-[340px] min-[900px]:border-l border-hairline-strong flex flex-col min-h-0 transition-colors duration-base ${
            highlightedLocation ? "bg-code-evidence-bg" : ""
          }`}
        >
          <div className="h-8 shrink-0 sticky top-0 bg-surface flex items-center px-md text-mono-eyebrow uppercase tracking-wide text-stone font-mono font-mono-noliga">
            Code
          </div>
          <div className="flex-1 overflow-auto p-lg flex flex-col gap-md">
            <CodeBlock
              code={code.snippet}
              startLine={code.startLine}
              qualifiedName={code.qualifiedName}
              language={code.language}
              evidenceLines={[code.startLine, code.endLine]}
              evidenceVerdict={fact.verdict}
            />
            <p className="text-mono-id font-mono font-mono-noliga text-stone flex items-center gap-sm">
              <span>
                {code.filePath} · {code.startLine}–{code.endLine}
              </span>
              <MetaBadge label={code.factType.toUpperCase()} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
