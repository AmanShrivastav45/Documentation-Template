// Styled table pieces for markdown tables (remark-gfm): rounded outer border,
// light header row, row hover. All mapped automatically in index.tsx —
// contributors just write pipe tables.
import type { ComponentPropsWithoutRef } from "react";

export function Table(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-line dark:border-line-dark">
      <table className="w-full border-collapse text-left text-sm" {...props} />
    </div>
  );
}

export function THead(props: ComponentPropsWithoutRef<"thead">) {
  return <thead className="bg-panel dark:bg-panel-dark" {...props} />;
}

export function TBody(props: ComponentPropsWithoutRef<"tbody">) {
  return (
    <tbody
      className="[&>tr:hover]:bg-panel/70 dark:[&>tr:hover]:bg-panel-dark/70 [&>tr:last-child>td]:border-b-0"
      {...props}
    />
  );
}

export function Th(props: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className="border-b border-line px-4 py-3 font-heading text-[13px] font-semibold tracking-wide text-soft dark:border-line-dark dark:text-soft-dark"
      {...props}
    />
  );
}

export function Td(props: ComponentPropsWithoutRef<"td">) {
  return <td className="border-b border-line px-4 py-3 dark:border-line-dark" {...props} />;
}
