import type { AskSource } from "../../types/domain";

export function SourceCard({ source }: { source: AskSource }) {
  const loc = source.source_location;
  return (
    <div className="bg-surface-raised border border-hairline rounded-lg p-lg flex flex-col gap-sm">
      <div className="flex items-center justify-between">
        <span className="font-mono font-mono-noliga text-mono-id text-ink">{loc.document_name}</span>
        <span className="font-mono font-mono-noliga text-mono-id text-stone tabular-nums">
          chunk {loc.chunk_index} · sim {loc.similarity_score.toFixed(2)}
        </span>
      </div>
      <p className="text-body-md text-body">{loc.context}</p>
      {loc.url && (
        <a href={loc.url} target="_blank" rel="noreferrer" className="text-label-sm text-accent hover:underline">
          Open source
        </a>
      )}
    </div>
  );
}
