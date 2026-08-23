import { useState } from "react";
import { getHistory, clearHistory, exportEntryAsJson, exportEntryAsCsv, type HistoryEntry } from "../../history/store";
import { Button } from "../../components/primitives/Button";
import { EmptyState } from "../../components/signature/EmptyState";
import { TriageList } from "../../components/signature/TriageList";
import { CompareLedger } from "../../components/signature/CompareLedger";
import { DiscrepancyStack } from "../Compare/DiscrepancyStack";
import { sortFacts } from "../Compare/sort";
import { buildLedgerCode } from "../Compare/ledgerCode";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

export function HistoryScreen() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => getHistory());
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(entries[0]?.id ?? null);
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) ?? null;
  const visibleFacts = selectedEntry
    ? sortFacts(
        selectedEntry.response.verdicts.filter((v) => {
          const q = searchValue.toLowerCase();
          return (
            q === "" || v.qualified_name.toLowerCase().includes(q) || v.fact_id.toLowerCase().includes(q)
          );
        })
      )
    : [];
  const selectedFact = selectedEntry?.response.verdicts.find((v) => v.fact_id === selectedFactId) ?? null;

  function handleClear() {
    if (!window.confirm("Clear all local compare history? This cannot be undone.")) return;
    clearHistory();
    setEntries([]);
    setSelectedEntryId(null);
  }

  if (entries.length === 0) {
    return (
      <div className="p-xl">
        <EmptyState title="No compare history yet" description="Run a compare on the Compare screen to save it here." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-lg border-b border-hairline flex items-center justify-between">
        <div>
          <h1 className="text-title-md text-ink">History</h1>
          <p className="text-body-sm text-mute">
            Stored only in this browser — the API has no compare-artifact list endpoint.
          </p>
        </div>
        <Button variant="danger" onClick={handleClear}>
          Clear history
        </Button>
      </div>
      <div className="flex-1 min-h-0 flex flex-col min-[1024px]:flex-row">
        <div className="w-full min-[1024px]:w-[320px] shrink-0 border-r border-hairline overflow-auto">
          {entries.map((entry) => {
            const { relative, absolute } = formatRelativeTime(entry.saved_at);
            const active = entry.id === selectedEntryId;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setSelectedEntryId(entry.id);
                  setSelectedFactId(entry.response.verdicts[0]?.fact_id ?? null);
                }}
                className={`w-full text-left px-lg py-md border-b border-hairline ${active ? "bg-accent-tint" : "hover:bg-surface"}`}
              >
                <p className="font-mono font-mono-noliga text-mono-id text-ink">{entry.response.run_id}</p>
                <p className="text-body-sm text-mute">
                  {entry.response.domain} · {entry.response.summary.total} facts
                </p>
                <time dateTime={entry.saved_at} title={absolute} className="text-caption text-stone">
                  {relative}
                </time>
              </button>
            );
          })}
        </div>
        <div className="flex-1 min-h-0 flex flex-col min-[1024px]:flex-row">
          {selectedEntry && (
            <>
              <div className="flex items-center gap-sm px-lg py-sm border-b border-hairline min-[1024px]:hidden" />
              <TriageList
                facts={visibleFacts}
                selectedFactId={selectedFactId}
                onSelectFact={setSelectedFactId}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
              />
              <div className="flex-1 min-h-0 flex flex-col overflow-auto">
                <div className="flex justify-end gap-sm p-md border-b border-hairline">
                  <Button variant="outline" onClick={() => exportEntryAsJson(selectedEntry)}>
                    Export JSON
                  </Button>
                  <Button variant="outline" onClick={() => exportEntryAsCsv(selectedEntry)}>
                    Export CSV
                  </Button>
                </div>
                {selectedFact ? (
                  <>
                    <CompareLedger fact={selectedFact} code={buildLedgerCode(selectedFact, "")} />
                    <DiscrepancyStack fact={selectedFact} onLocationClick={() => {}} />
                  </>
                ) : (
                  <EmptyState title="No fact selected" description="Choose a row from the triage list." />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
