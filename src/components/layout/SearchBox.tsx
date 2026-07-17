// Sidebar search input. Ctrl+K / Cmd+K focuses it from anywhere; the value
// is owned by Sidebar, which filters the nav tree with it.
import { useEffect, useRef } from "react";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBox({ value, onChange }: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-soft dark:text-soft-dark"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search docs (Ctrl K to open)"
        className="w-full rounded-md border border-transparent bg-[#ececec] py-2 pl-9 pr-3 text-sm text-ink placeholder:text-soft focus:border-accent focus:bg-white focus:outline-none dark:bg-panel-dark dark:text-ink-dark dark:placeholder:text-soft-dark dark:focus:bg-canvas-dark"
      />
    </div>
  );
}
