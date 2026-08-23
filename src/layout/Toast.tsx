import { useState } from "react";
import { useToast, type ToastItem } from "../context/ToastContext";
import { JsonViewer } from "../components/signature/JsonViewer";
import { IconButton } from "../components/primitives/Button";

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const barClass = toast.kind === "success" ? "bg-verdict-aligned" : "bg-verdict-misaligned";
  return (
    <div className="relative bg-surface-raised border border-hairline rounded-lg shadow-pop max-w-[380px] overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${barClass}`} />
      <div className="pl-lg pr-md py-md flex items-start gap-sm">
        <p className="flex-1 text-body-md text-ink">{toast.message}</p>
        <IconButton aria-label="Dismiss notification" onClick={onDismiss}>
          ×
        </IconButton>
      </div>
      {toast.kind === "error" && toast.detail !== undefined && (
        <div className="px-lg pb-md">
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="text-label-sm text-accent hover:underline"
          >
            {showDetails ? "Hide details" : "Details"}
          </button>
          {showDetails && (
            <div className="mt-sm">
              <JsonViewer data={toast.detail} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ToastViewport() {
  const { toasts, dismissToast } = useToast();
  return (
    <div className="fixed bottom-lg right-lg flex flex-col gap-sm z-50" aria-live="polite">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}
