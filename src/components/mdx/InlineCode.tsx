// Inline `code` chip. Fenced blocks never reach this — the `pre` element is
// intercepted by CodeBlock first, so this only styles inline snippets.
import type { ComponentPropsWithoutRef } from "react";

export default function InlineCode(props: ComponentPropsWithoutRef<"code">) {
  return (
    <code
      className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[14px] dark:border-line-dark dark:bg-panel-dark"
      {...props}
    />
  );
}
