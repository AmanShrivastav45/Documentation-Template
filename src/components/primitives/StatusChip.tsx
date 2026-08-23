import type { IngestionStatus } from "../../types/domain";

const STATUS_MAP: Record<IngestionStatus, { text: string; tint: string; label: string }> = {
  ingested: { text: "text-verdict-aligned", tint: "bg-verdict-aligned-tint", label: "INGESTED" },
  pending: { text: "text-verdict-partial", tint: "bg-verdict-partial-tint", label: "PENDING" },
  failed: { text: "text-verdict-misaligned", tint: "bg-verdict-misaligned-tint", label: "FAILED" },
};

export function StatusChip({ status }: { status: IngestionStatus }) {
  const s = STATUS_MAP[status];
  return (
    <span
      className={`inline-flex items-center h-5 px-sm rounded-sm text-mono-eyebrow uppercase font-mono font-mono-noliga tracking-wide ${s.text} ${s.tint}`}
    >
      {s.label}
    </span>
  );
}
