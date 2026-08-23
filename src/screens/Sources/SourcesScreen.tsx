import { useDomains } from "../../hooks/useDomains";
import { useDocuments } from "../../hooks/useDocuments";
import { UploadPanel } from "./UploadPanel";
import { DocumentList } from "./DocumentList";

export function SourcesScreen() {
  const domainsQuery = useDomains();
  const documentsQuery = useDocuments();

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
    </div>
  );
}
