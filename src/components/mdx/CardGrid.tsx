// Responsive grid wrapper for <Card>s: <CardGrid columns={2}>…</CardGrid>.
// Collapses to one column on small screens.
import type { ReactNode } from "react";

export interface CardGridProps {
  columns?: 2 | 3 | 4;
  children?: ReactNode;
}

const COLUMN_CLASS: Record<2 | 3 | 4, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export function CardGrid({ columns = 2, children }: CardGridProps) {
  return <div className={`my-6 grid gap-4 ${COLUMN_CLASS[columns]}`}>{children}</div>;
}
