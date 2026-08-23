import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface ActiveRun {
  runId: string;
  domain: string;
}

interface RunContextValue {
  activeRun: ActiveRun | null;
  setActiveRun: (run: ActiveRun | null) => void;
}

const RunContext = createContext<RunContextValue | null>(null);

export function RunProvider({ children }: { children: ReactNode }) {
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const value = useMemo(() => ({ activeRun, setActiveRun }), [activeRun]);
  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook must live alongside its Provider
export function useRun(): RunContextValue {
  const ctx = useContext(RunContext);
  if (!ctx) throw new Error("useRun must be used within RunProvider");
  return ctx;
}
