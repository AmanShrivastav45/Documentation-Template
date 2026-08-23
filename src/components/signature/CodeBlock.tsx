import { useState } from "react";
import { tokenizeLine } from "./tokenize";
import { IconButton } from "../primitives/Button";
import type { Verdict } from "../../types/domain";
import { verdictColorClass } from "../primitives/verdict";

interface CodeBlockProps {
  code: string;
  startLine: number;
  qualifiedName: string;
  language: string;
  evidenceLines?: [number, number];
  evidenceVerdict?: Verdict;
}

const COLLAPSE_AT = 24;

const EVIDENCE_BORDER: Record<Verdict, string> = {
  Aligned: "border-l-verdict-aligned",
  Partial: "border-l-verdict-partial",
  Misaligned: "border-l-verdict-misaligned",
  Unrelated: "border-l-verdict-unrelated",
};

export function CodeBlock({
  code,
  startLine,
  qualifiedName,
  language,
  evidenceLines,
  evidenceVerdict,
}: CodeBlockProps) {
  const [wrap, setWrap] = useState<boolean>(() => localStorage.getItem("mvc.codewrap") === "true");
  const [expanded, setExpanded] = useState(false);
  const lines = code.split("\n");
  const visibleLines = expanded ? lines : lines.slice(0, COLLAPSE_AT);
  const evidenceClass = evidenceVerdict ? verdictColorClass(evidenceVerdict) : null;

  function toggleWrap() {
    setWrap((w) => {
      localStorage.setItem("mvc.codewrap", String(!w));
      return !w;
    });
  }

  return (
    <div className="border border-hairline rounded-lg overflow-hidden bg-code-bg">
      <div className="h-8 flex items-center justify-between px-md bg-surface border-b border-hairline">
        <span className="text-mono-id font-mono font-mono-noliga text-stone truncate">
          {language} · {qualifiedName}
        </span>
        <div className="flex items-center gap-xxs">
          <IconButton aria-label={wrap ? "Disable soft wrap" : "Enable soft wrap"} onClick={toggleWrap}>
            ↵
          </IconButton>
          <IconButton aria-label="Copy code" onClick={() => navigator.clipboard.writeText(code)}>
            ⧉
          </IconButton>
        </div>
      </div>
      <div
        role="region"
        aria-label={`Code for ${qualifiedName}`}
        tabIndex={0}
        className={`code-block font-mono-noliga text-mono-code ${wrap ? "" : "overflow-x-auto"}`}
        style={{ tabSize: 4 }}
      >
        {visibleLines.map((line, i) => {
          const absoluteLine = startLine + i;
          const isEvidence =
            evidenceLines && absoluteLine >= evidenceLines[0] && absoluteLine <= evidenceLines[1];
          return (
            <div
              key={absoluteLine}
              className={`flex ${
                isEvidence && evidenceClass && evidenceVerdict
                  ? `${evidenceClass.tint} border-l-2 ${EVIDENCE_BORDER[evidenceVerdict]}`
                  : ""
              }`}
            >
              <span className="w-11 shrink-0 bg-code-gutter text-code-line-no text-right pr-sm select-none border-r border-hairline">
                {absoluteLine}
              </span>
              <span className={`pl-sm ${wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"}`}>
                {tokenizeLine(line).map((tok, idx) => (
                  <span key={idx} className={tok.className}>
                    {tok.text}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
      {lines.length > COLLAPSE_AT && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full text-label-sm text-accent hover:underline py-sm border-t border-hairline"
        >
          Show all ({lines.length} lines)
        </button>
      )}
    </div>
  );
}
