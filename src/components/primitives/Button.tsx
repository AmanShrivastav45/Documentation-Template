import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "quiet" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center h-9 px-4 rounded-md text-label-md font-sans transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-ink text-on-fill hover:bg-body active:brightness-90 disabled:bg-surface-sunken disabled:text-faint",
  outline:
    "bg-transparent text-ink border border-hairline-strong hover:bg-surface disabled:text-faint disabled:border-hairline",
  quiet: "bg-transparent text-mute hover:bg-surface disabled:text-faint",
  danger:
    "bg-transparent text-verdict-misaligned border border-verdict-misaligned hover:bg-verdict-misaligned-tint disabled:text-faint disabled:border-hairline",
};

export function Button({
  variant = "primary",
  loading = false,
  loadingLabel,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? loadingLabel ?? "Working…" : children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  children: ReactNode;
}

export function IconButton({ className = "", children, ...rest }: IconButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-mute hover:bg-surface transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
