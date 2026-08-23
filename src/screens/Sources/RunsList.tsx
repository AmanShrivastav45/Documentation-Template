import type { CodeRun } from "../../types/domain";
import { MetaBadge } from "../../components/primitives/MetaBadge";
import { EmptyState } from "../../components/signature/EmptyState";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

function parseRunTimestamp(createdAt: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/.exec(createdAt);
  if (!m) return createdAt;
  const [, y, mo, d, h, mi, s] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
}

export function RunsList({ runs }: { runs: CodeRun[] }) {
  if (runs.length === 0) {
    return <EmptyState title="No code runs yet" description="Ingest a GitLab file above to create one." />;
  }

  return (
    <div className="border border-hairline rounded-lg overflow-hidden">
      {runs.map((run) => {
        const { relative, absolute } = formatRelativeTime(parseRunTimestamp(run.created_at));
        return (
          <div key={run.run_id} className="flex items-center gap-md px-lg py-md border-b border-hairline last:border-b-0">
            <div className="flex-1 min-w-0">
              <p className="font-mono font-mono-noliga text-mono-id text-ink truncate">{run.run_id}</p>
              <p className="text-body-sm text-mute truncate">{run.file_path}</p>
            </div>
            <span className="text-caption text-stone">{run.facts_total} facts</span>
            <span className="text-caption text-stone">{run.key_calculation_count} key</span>
            {run.llm_refined ? (
              <MetaBadge label="LLM REFINED" />
            ) : (
              <MetaBadge label={run.llm_skip_reason ?? "LLM SKIPPED"} tooltip={run.llm_skip_reason ?? undefined} />
            )}
            <time dateTime={parseRunTimestamp(run.created_at)} title={absolute} className="text-caption text-stone">
              {relative}
            </time>
          </div>
        );
      })}
    </div>
  );
}
