import { useDomains } from "../../hooks/useDomains";
import { useDocuments } from "../../hooks/useDocuments";
import { useRuns } from "../../hooks/useRuns";
import { UploadPanel } from "./UploadPanel";
import { DocumentList } from "./DocumentList";
import { GitLabIngest } from "./GitLabIngest";
import { RunsList } from "./RunsList";

export function SourcesScreen() {
  const domainsQuery = useDomains();
  const documentsQuery = useDocuments();
  const runsQuery = useRuns();

  return (
    <div className="max-w-[960px] mx-auto p-xl flex flex-col gap-xxl">
      <div>
        <h1 className="text-title-xl text-ink mb-lg">Sources</h1>
        <UploadPanel onUploaded={documentsQuery.refresh} />
      </div>
      <div>
        <h2 className="text-title-md text-ink mb-lg">Uploaded documents</h2>
        <DocumentList
          documents={documentsQuery.data?.documents ?? []}
          loading={documentsQuery.status === "loading" || documentsQuery.status === "idle"}
          domains={domainsQuery.data?.domains ?? []}
        />
      </div>
      <div>
        <h2 className="text-title-md text-ink mb-lg">Ingest code from GitLab</h2>
        <GitLabIngest onIngested={runsQuery.refresh} />
      </div>
      <div>
        <h2 className="text-title-md text-ink mb-lg">Code runs</h2>
        <RunsList runs={runsQuery.data?.runs ?? []} />
      </div>
    </div>
  );
}
