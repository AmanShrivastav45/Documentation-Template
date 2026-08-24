const SHORTCUTS: Array<[string, string]> = [
  ["j / k or ↓ / ↑", "Move through the triage list"],
  ["Enter", "Load the focused fact into the Ledger"],
  ["1 2 3 4", "Filter to Misaligned / Partial / Unrelated / Aligned"],
  ["0", "Clear verdict filters"],
  ["/", "Focus the triage search"],
  ["c", "Copy the focused fact's fact_id"],
  ["Esc", "Close the drawer, clear search, or blur"],
  ["?", "Shortcut overlay"],
];

export function ShortcutOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-overlay z-50 flex items-center justify-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-raised border border-hairline rounded-lg shadow-pop p-xl max-w-md w-full"
      >
        <h2 className="text-title-sm text-ink mb-lg">Keyboard shortcuts</h2>
        <dl className="flex flex-col gap-sm">
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between gap-md">
              <dt className="font-mono font-mono-noliga text-mono-code-sm bg-surface-sunken rounded-xs px-sm py-xxs">
                {key}
              </dt>
              <dd className="text-body-sm text-mute text-right">{desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
