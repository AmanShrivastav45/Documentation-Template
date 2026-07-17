// Landing-page card: <Card title="…" number={1}>body</Card>. The optional
// number renders the Grafana-style step badge. Place inside a <CardGrid>.
import type { ReactNode } from "react";

export interface CardProps {
  title: string;
  number?: number;
  children?: ReactNode;
}

export function Card({ title, number, children }: CardProps) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-sm transition-all hover:border-accent/50 hover:shadow-md dark:border-line-dark dark:bg-panel-dark dark:hover:border-accent-dark/50">
      {number !== undefined && (
        <span className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 font-heading text-sm font-semibold text-accent dark:bg-accent-dark/15 dark:text-accent-dark">
          {number}
        </span>
      )}
      <h3 className="mb-1.5 font-heading text-base font-semibold">{title}</h3>
      <div className="text-sm text-soft dark:text-soft-dark">{children}</div>
    </div>
  );
}
