import { useState } from "react";
import { useDomains } from "../../hooks/useDomains";
import { useUpload } from "../../hooks/useUpload";
import { useToast } from "../../context/ToastContext";
import { SelectField } from "../../components/primitives/SelectField";
import { FileDrop } from "../../components/signature/FileDrop";
import { ApiClientError } from "../../api/client";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

interface UploadPanelProps {
  onUploaded: () => void;
}

export function UploadPanel({ onUploaded }: UploadPanelProps) {
  const domainsQuery = useDomains();
  const upload = useUpload();
  const { showToast } = useToast();
  const [domain, setDomain] = useState("");
  const [domainError, setDomainError] = useState<string | null>(null);

  const activeDomain = domain || domainsQuery.data?.default_domain || "";

  async function handleFile(file: File) {
    setDomainError(null);
    try {
      const result = await upload.run(file, activeDomain);
      showToast({ kind: "success", message: `${result.filename} uploaded to ${result.domain}.` });
      onUploaded();
    } catch (err) {
      const detail = err instanceof ApiClientError ? err.detail : undefined;
      const message = err instanceof ApiClientError ? err.message : "Upload failed";
      const allowedDomains =
        Array.isArray(detail) && detail[0]?.allowed_domains ? (detail[0].allowed_domains as string[]) : null;
      if (allowedDomains) {
        setDomainError(`Unsupported domain. Allowed: ${allowedDomains.join(", ")}`);
      }
      showToast({ kind: "error", message, detail });
    }
  }

  return (
    <div className="flex flex-col gap-md">
      <SelectField
        id="upload-domain"
        label="Target domain"
        value={activeDomain as never}
        options={(domainsQuery.data?.domains ?? []).map((d) => ({ value: d as never, label: d }))}
        onChange={(v) => setDomain(v)}
      />
      {domainError && <p className="text-body-sm text-verdict-misaligned">{domainError}</p>}
      <FileDrop allowedExtensions={ALLOWED_EXTENSIONS} domain={activeDomain} onFileSelected={handleFile} />
    </div>
  );
}
