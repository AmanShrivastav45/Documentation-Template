import { useRef, useState } from "react";

interface FileDropProps {
  allowedExtensions: string[];
  domain: string;
  onFileSelected: (file: File) => void;
}

export function FileDrop({ allowedExtensions, domain, onFileSelected }: FileDropProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateAndEmit(file: File) {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`Unsupported file type '${ext}'. Allowed: ${allowedExtensions.join(", ")}`);
      return;
    }
    setError(null);
    onFileSelected(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) validateAndEmit(file);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={`h-[140px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-xs cursor-pointer ${
          dragOver ? "border-accent bg-accent-tint" : "border-hairline-strong bg-surface"
        }`}
      >
        <span className={`text-2xl ${dragOver ? "text-accent" : "text-mute"}`} aria-hidden="true">
          ⬆
        </span>
        <p className="text-body-sm text-mute">
          Drop a document for <strong className="text-ink">{domain}</strong>, or click to browse
        </p>
        <p className="text-caption text-faint">Allowed: {allowedExtensions.join(", ")}</p>
        <input
          ref={inputRef}
          type="file"
          accept={allowedExtensions.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) validateAndEmit(file);
          }}
        />
      </div>
      {error && <p className="text-body-sm text-verdict-misaligned mt-xs">{error}</p>}
    </div>
  );
}
