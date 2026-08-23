import { useState } from "react";
import { useExtractPreview } from "../../hooks/useExtractPreview";
import { useIngest } from "../../hooks/useIngest";
import { useToast } from "../../context/ToastContext";
import { TextInput } from "../../components/primitives/TextInput";
import { Toggle } from "../../components/primitives/Toggle";
import { Button } from "../../components/primitives/Button";
import { MetaBadge } from "../../components/primitives/MetaBadge";
import { EvidenceBlock } from "../../components/signature/EvidenceBlock";
import { JsonViewer } from "../../components/signature/JsonViewer";
import { parseGitlabUrl } from "../../utils/parseGitlabUrl";
import { ApiClientError } from "../../api/client";

interface GitLabIngestProps {
  onIngested: () => void;
}

export function GitLabIngest({ onIngested }: GitLabIngestProps) {
  const [url, setUrl] = useState("");
  const [keyOnly, setKeyOnly] = useState(false);
  const extract = useExtractPreview();
  const ingest = useIngest();
  const { showToast } = useToast();

  const parsed = parseGitlabUrl(url);

  async function handlePreview() {
    if (!parsed) return;
    try {
      await extract.run({ url, branch: parsed.branch, key_only: keyOnly });
    } catch (err) {
      showToast({
        kind: "error",
        message: err instanceof ApiClientError ? err.message : "Extract failed",
        detail: err instanceof ApiClientError ? err.detail : undefined,
      });
    }
  }

  async function handleIngest() {
    if (!parsed) return;
    try {
      await ingest.run({ url, branch: parsed.branch, key_only: keyOnly });
      showToast({ kind: "success", message: `Ingested ${parsed.path}.` });
      onIngested();
    } catch (err) {
      showToast({
        kind: "error",
        message: err instanceof ApiClientError ? err.message : "Ingest failed",
        detail: err instanceof ApiClientError ? err.detail : undefined,
      });
    }
  }

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        id="gitlab-url"
        label="GitLab file URL"
        mono
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://gitlab.nomura.com/group/repo/-/blob/master/src/trade_handler.py"
        error={url.length > 0 && !parsed ? "Cannot parse GitLab URL. Expected: .../group/repo/-/blob/branch/path" : undefined}
      />
      {parsed && (
        <p className="text-mono-code-sm font-mono font-mono-noliga text-stone">
          {parsed.group}/{parsed.repo} · {parsed.branch} · {parsed.path}
        </p>
      )}
      <Toggle id="gitlab-key-only" checked={keyOnly} onChange={setKeyOnly} label="Key calculations only" />
      <div className="flex gap-sm">
        <Button variant="outline" onClick={handlePreview} disabled={!parsed} loading={extract.status === "loading"}>
          Preview extract
        </Button>
        <Button variant="primary" onClick={handleIngest} disabled={!extract.data} loading={ingest.status === "loading"}>
          Ingest
        </Button>
      </div>

      {extract.data && (
        <EvidenceBlock>
          <div className="flex flex-col gap-sm">
            <p className="text-body-sm text-mute">
              {extract.data.chunk_count} chunks found, {extract.data.key_calculation_count} key calculations.
            </p>
            {extract.data.chunks.map((chunk) => (
              <div key={chunk.chunk_id} className="flex items-center gap-sm">
                <span className="font-mono font-mono-noliga text-mono-id text-ink flex-1 truncate">
                  {chunk.qualified_name}
                </span>
                {chunk.is_key_calculation && <MetaBadge label="KEY" />}
                <span className="text-caption text-stone">
                  {chunk.start_line}–{chunk.end_line}
                </span>
              </div>
            ))}
            <details>
              <summary className="text-label-sm text-accent hover:underline cursor-pointer">
                View raw JSON
              </summary>
              <div className="mt-sm">
                <JsonViewer data={extract.data} />
              </div>
            </details>
          </div>
        </EvidenceBlock>
      )}
    </div>
  );
}
