import { useHealth } from "../../hooks/useHealth";

export function HealthDot() {
  const { status, data } = useHealth();
  const colorClass =
    status === "success" && data?.status === "ok"
      ? "bg-verdict-aligned"
      : status === "error"
        ? "bg-verdict-misaligned"
        : "bg-faint";
  const label =
    status === "success" && data?.status === "ok"
      ? "Backend reachable"
      : status === "error"
        ? "Backend unreachable"
        : "Checking backend…";
  return (
    <span
      role="status"
      title={`${label} — ${import.meta.env.VITE_MVC_API_BASE_URL}`}
      className={`inline-block h-2 w-2 rounded-full ${colorClass}`}
    />
  );
}
