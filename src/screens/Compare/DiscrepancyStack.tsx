import type { FactVerdict } from "../../types/domain";
import { DiscrepancyItem } from "../../components/signature/DiscrepancyItem";

interface DiscrepancyStackProps {
  fact: FactVerdict;
  onLocationClick: (location: string) => void;
}

export function DiscrepancyStack({ fact, onLocationClick }: DiscrepancyStackProps) {
  if (fact.discrepancies.length === 0) return null;
  return (
    <div className="p-lg flex flex-col gap-md">
      <h3 className="text-title-sm text-ink">Discrepancies ({fact.discrepancies.length})</h3>
      {fact.discrepancies.map((d, i) => (
        <DiscrepancyItem key={i} discrepancy={d} verdict={fact.verdict} onLocationClick={onLocationClick} />
      ))}
    </div>
  );
}
