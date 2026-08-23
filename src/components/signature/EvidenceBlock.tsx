import type { ReactNode } from "react";

export function EvidenceBlock({ children }: { children: ReactNode }) {
  return <div className="bg-surface-raised border border-hairline rounded-lg p-lg">{children}</div>;
}
