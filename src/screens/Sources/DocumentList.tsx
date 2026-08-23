import { useState } from "react";
import type { DocumentRecord } from "../../types/domain";
import { StatusChip } from "../../components/primitives/StatusChip";
import { SelectField } from "../../components/primitives/SelectField";
import { EmptyState } from "../../components/signature/EmptyState";
import { Skeleton } from "../../components/signature/Skeleton";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

interface DocumentListProps {
  documents: DocumentRecord[];
  loading: boolean;
  domains: string[];
}

export function DocumentList({ documents, loading, domains }: DocumentListProps) {
  const [domainFilter, setDomainFilter] = useState<string>("");

  const visible = domainFilter ? documents.filter((d) => d.domain === domainFilter) : documents;

  if (loading) {
    return (
      <div className="flex flex-col gap-sm">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (documents.length === 0) {
    return <EmptyState title="No documents yet" description="Upload a model document above to get started." />;
  }

  return (
    <div className="flex flex-col gap-md">
      <SelectField
        id="document-domain-filter"
        label="Filter by domain"
        value={domainFilter as never}
        placeholder="All domains"
        options={domains.map((d) => ({ value: d as never, label: d }))}
        onChange={(v) => setDomainFilter(v)}
      />
      <div className="border border-hairline rounded-lg overflow-hidden">
        {visible.map((doc) => {
          const { relative, absolute } = formatRelativeTime(doc.uploaded_at);
          return (
            <div
              key={doc.saved_path}
              className="h-11 flex items-center gap-md px-lg border-b border-hairline last:border-b-0"
            >
              <span className="flex-1 truncate text-body-md text-ink">{doc.filename}</span>
              <span className="text-label-sm text-mute">{doc.domain}</span>
              <StatusChip status={doc.ingestion_status} />
              <time dateTime={doc.uploaded_at} title={absolute} className="text-caption text-stone w-20 text-right">
                {relative}
              </time>
            </div>
          );
        })}
      </div>
    </div>
  );
}
