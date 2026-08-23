import type { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  mono?: boolean;
  error?: string;
}

export function TextInput({ label, id, mono = false, error, className = "", ...rest }: TextInputProps) {
  return (
    <div className="flex flex-col gap-xxs">
      <label htmlFor={id} className="text-label-md text-mute">
        {label}
      </label>
      <input
        id={id}
        className={`h-9 px-md rounded-md border bg-canvas text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          mono ? "font-mono font-mono-noliga text-mono-code-sm" : "text-body-md"
        } ${error ? "border-verdict-misaligned" : "border-hairline-strong"} ${className}`}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error && <p className="text-body-sm text-verdict-misaligned">{error}</p>}
    </div>
  );
}
