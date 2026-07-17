// Tabbed content: <Tabs><Tab label="npm">…</Tab></Tabs>. Active tab gets a
// blue underline; Left/Right arrows switch tabs (roving tabindex).
import {
  Children,
  isValidElement,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";

export interface TabProps {
  label: string;
  children?: ReactNode;
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

export interface TabsProps {
  children?: ReactNode;
}

export function Tabs({ children }: TabsProps) {
  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<TabProps> =>
      isValidElement<TabProps>(child) && typeof child.props.label === "string",
  );
  const [active, setActive] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const next = (active + delta + tabs.length) % tabs.length;
    setActive(next);
    buttonRefs.current[next]?.focus();
  };

  if (tabs.length === 0) return null;

  return (
    <div className="my-6">
      <div
        role="tablist"
        onKeyDown={onKeyDown}
        className="flex gap-1 border-b border-line dark:border-line-dark"
      >
        {tabs.map((tab, i) => {
          const selected = i === active;
          return (
            <button
              key={tab.props.label}
              ref={(el) => {
                buttonRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
                selected
                  ? "border-accent font-medium text-accent dark:border-accent-dark dark:text-accent-dark"
                  : "border-transparent text-soft hover:text-ink dark:text-soft-dark dark:hover:text-ink-dark"
              }`}
            >
              {tab.props.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${baseId}-panel-${active}`} aria-labelledby={`${baseId}-tab-${active}`}>
        {tabs[active]}
      </div>
    </div>
  );
}
