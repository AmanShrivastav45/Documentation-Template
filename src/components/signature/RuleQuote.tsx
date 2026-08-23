export function RuleQuote({ text }: { text: string }) {
  return (
    <blockquote className="bg-surface-sunken border-l-2 border-hairline-strong rounded-r-xs px-lg py-md text-body-lg text-body not-italic">
      {text}
    </blockquote>
  );
}
