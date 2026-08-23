import type { ReactNode } from "react";

export interface SelectOption<T extends string> {
  value: T;
  label: ReactNode;
  secondary?: ReactNode;
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T | "";
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  id: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
  id,
}: SelectFieldProps<T>) {
  return (
    <div className="flex flex-col gap-xxs">
      <label htmlFor={id} className="text-label-md text-mute">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 px-md rounded-md border border-hairline-strong bg-canvas text-ink text-body-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {typeof opt.label === "string" ? opt.label : opt.value}
          </option>
        ))}
      </select>
    </div>
  );
}
