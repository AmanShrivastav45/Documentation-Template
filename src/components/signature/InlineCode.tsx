export function InlineCode({ children }: { children: string }) {
  return (
    <code className="inline-code font-mono font-mono-noliga text-mono-code-sm bg-surface-sunken rounded-xs px-[5px] py-px">
      {children}
    </code>
  );
}
