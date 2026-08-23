import { useEffect, useState } from "react";

interface ProgressCompareProps {
  factsTotal: number;
  domain: string;
  profile: string;
}

export function ProgressCompare({ factsTotal, domain, profile }: ProgressCompareProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => setElapsedMs(Date.now() - start), 1000);
    return () => clearInterval(interval);
  }, []);

  const seconds = Math.floor(elapsedMs / 1000);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex-1 h-[88px] flex flex-col justify-center gap-sm px-lg rounded-lg border border-hairline bg-surface-raised"
    >
      <div className="h-[2px] w-full bg-hairline overflow-hidden rounded-full">
        <div className="h-full w-1/3 bg-accent animate-[indeterminate_1.2s_ease-in-out_infinite]" />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-body-md text-ink">
          Comparing {factsTotal} facts against {domain} · {profile}
        </p>
        <span className="font-mono font-mono-noliga text-mono-id tabular-nums text-stone">{seconds}s</span>
      </div>
      {seconds > 30 && (
        <p className="text-body-sm text-mute">Comprehensive search takes longer. Still working.</p>
      )}
    </div>
  );
}
