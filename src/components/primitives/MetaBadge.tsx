interface MetaBadgeProps {
  label: string;
  tooltip?: string;
}

export function MetaBadge({ label, tooltip }: MetaBadgeProps) {
  return (
    <span
      title={tooltip}
      className="inline-flex items-center h-5 px-xs rounded-sm bg-surface-sunken text-mute text-mono-eyebrow uppercase font-mono font-mono-noliga tracking-wide"
    >
      {label}
    </span>
  );
}
