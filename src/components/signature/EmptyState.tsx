import { Button } from "../primitives/Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-sm max-w-[380px] mx-auto py-xxl">
      <h3 className="text-title-sm font-medium text-ink">{title}</h3>
      <p className="text-body-sm text-mute">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="mt-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
