export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-sunken rounded-md animate-skeleton-pulse ${className}`} />;
}
