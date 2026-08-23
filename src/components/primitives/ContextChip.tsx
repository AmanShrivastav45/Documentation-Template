export function ContextChip({ runId, domain }: { runId: string; domain: string }) {
  return (
    <span className="inline-flex items-center gap-sm h-6 px-sm rounded-sm bg-surface border border-hairline">
      <span className="font-mono font-mono-noliga text-mono-id text-ink">{runId}</span>
      <span className="text-label-sm text-mute">{domain}</span>
    </span>
  );
}
