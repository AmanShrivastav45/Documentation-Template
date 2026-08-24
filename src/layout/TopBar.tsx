import { HealthDot } from "../components/signature/HealthDot";
import { ContextChip } from "../components/primitives/ContextChip";
import { IconButton } from "../components/primitives/Button";
import { useRun } from "../context/RunContext";
import { useTheme } from "../context/ThemeContext";

const CYCLE: Record<string, "light" | "dark" | "system"> = {
  system: "light",
  light: "dark",
  dark: "system",
};

export function TopBar({ onOpenShortcuts }: { onOpenShortcuts: () => void }) {
  const { activeRun } = useRun();
  const { mode, setMode } = useTheme();

  return (
    <header className="h-[52px] shrink-0 bg-canvas border-b border-hairline flex items-center px-lg sticky top-0 z-40">
      <div className="text-title-sm">
        <span className="font-mono font-mono-noliga font-medium">MVC</span>{" "}
        <span className="font-sans">Compare</span>
      </div>
      <div className="flex-1 flex justify-center">
        {activeRun && <ContextChip runId={activeRun.runId} domain={activeRun.domain} />}
      </div>
      <div className="flex items-center gap-md">
        <HealthDot />
        <IconButton aria-label={`Theme: ${mode}. Click to change.`} onClick={() => setMode(CYCLE[mode])}>
          {mode === "dark" ? "☾" : mode === "light" ? "☀" : "◐"}
        </IconButton>
        <IconButton aria-label="Keyboard shortcuts" onClick={onOpenShortcuts}>
          ?
        </IconButton>
      </div>
    </header>
  );
}
