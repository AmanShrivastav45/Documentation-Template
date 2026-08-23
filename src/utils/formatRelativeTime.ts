export function formatRelativeTime(iso: string): { relative: string; absolute: string } {
  const date = new Date(iso);
  const absolute = date.toLocaleString();
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return { relative: "just now", absolute };
  if (diffMin < 60) return { relative: `${diffMin} min ago`, absolute };
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return { relative: `${diffHr} hr ago`, absolute };
  const diffDay = Math.floor(diffHr / 24);
  return { relative: `${diffDay} day${diffDay === 1 ? "" : "s"} ago`, absolute };
}
