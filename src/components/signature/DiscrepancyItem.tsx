import type { Discrepancy, Verdict } from "../../types/domain";
import { MetaBadge } from "../primitives/MetaBadge";
import { RuleQuote } from "./RuleQuote";
import { verdictColorClass } from "../primitives/verdict";

interface DiscrepancyItemProps {
  discrepancy: Discrepancy;
  verdict: Verdict;
  onLocationClick?: (location: string) => void;
}

export function DiscrepancyItem({ discrepancy, verdict, onLocationClick }: DiscrepancyItemProps) {
  const { bar } = verdictColorClass(verdict);
  return (
    <div className={`relative bg-surface-raised border border-hairline rounded-lg p-lg pl-xl overflow-hidden`}>
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${bar}`} />
      <div className="flex items-center gap-sm mb-sm">
        <MetaBadge label={discrepancy.type.toUpperCase()} />
      </div>
      <p className="text-body-md text-ink mb-md">{discrepancy.description}</p>
      <div className="flex flex-col min-[1024px]:flex-row gap-md">
        {discrepancy.rule_text && (
          <div className="flex-1">
            <RuleQuote text={discrepancy.rule_text} />
          </div>
        )}
        {discrepancy.code_location && (
          <div className="flex-1">
            <button
              type="button"
              onClick={() => onLocationClick?.(discrepancy.code_location!)}
              className="w-full text-left font-mono font-mono-noliga text-mono-code-sm bg-surface-sunken rounded-md px-md py-sm hover:bg-surface-sunken/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {discrepancy.code_location}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
