// Tinted notice box: <Callout type="info | warning | success | danger">.
// Plain markdown blockquotes are mapped to the info style in index.tsx.
// Add a variant by extending the STYLES map below.
import type { ReactNode } from "react";

type CalloutType = "info" | "warning" | "success" | "danger";

export interface CalloutProps {
  type?: CalloutType;
  children?: ReactNode;
}

const STYLES: Record<CalloutType, { box: string; icon: string; path: ReactNode }> = {
  info: {
    box: "border-accent bg-[#eef3fc] dark:border-accent-dark dark:bg-[#182236]",
    icon: "text-accent dark:text-accent-dark",
    path: <path d="M12 8h.01M11 12h1v4h1" />,
  },
  warning: {
    box: "border-[#f59e0b] bg-[#fdf6e7] dark:bg-[#2b2312]",
    icon: "text-[#f59e0b]",
    path: <path d="M12 8v4m0 4h.01" />,
  },
  success: {
    box: "border-[#22c55e] bg-[#ecfdf3] dark:bg-[#132a1c]",
    icon: "text-[#22c55e]",
    path: <path d="m8.5 12.5 2.5 2.5 4.5-5" />,
  },
  danger: {
    box: "border-[#ef4444] bg-[#fdf0ef] dark:bg-[#2d1717]",
    icon: "text-[#ef4444]",
    path: <path d="m9.5 9.5 5 5m0-5-5 5" />,
  },
};

export function Callout({ type = "info", children }: CalloutProps) {
  const style = STYLES[type];
  return (
    <div className={`my-6 flex gap-3 rounded-md border-l-4 px-4 py-3 ${style.box}`}>
      <svg
        className={`mt-1 shrink-0 ${style.icon}`}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        {style.path}
      </svg>
      <div className="min-w-0 text-[15px] [&>p]:my-1">{children}</div>
    </div>
  );
}
