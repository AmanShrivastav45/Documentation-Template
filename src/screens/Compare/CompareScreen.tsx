import { useEffect, useRef } from "react";
import { ApiClientError } from "../../api/client";
import { useDomains } from "../../hooks/useDomains";
import { useRuns } from "../../hooks/useRuns";
import { useCompare } from "../../hooks/useCompare";
import { useRun } from "../../context/RunContext";
import { useToast } from "../../context/ToastContext";
import { useCompareState } from "./useCompareState";
import { ControlBar } from "./ControlBar";
import { SummaryStrip } from "./SummaryStrip";
import { ProgressCompare } from "../../components/signature/ProgressCompare";
import { EmptyState } from "../../components/signature/EmptyState";
import { TriageList } from "../../components/signature/TriageList";
import { CompareLedger } from "../../components/signature/CompareLedger";
import { DiscrepancyStack } from "./DiscrepancyStack";
import { useKeyboardTriage } from "./useKeyboardTriage";
import { sortFacts } from "./sort";
import { buildLedgerCode } from "./ledgerCode";
import { recordHistory } from "../../history/store";

export function CompareScreen() {
  const domainsQuery = useDomains();
  const runsQuery = useRuns();
  const compare = useCompare();
  const { setActiveRun } = useRun();
  const { showToast } = useToast();
  const state = useCompareState();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (domainsQuery.data && !state.domain) {
      state.setDomain(domainsQuery.data.default_domain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainsQuery.data]);

  async function handleCompare() {
    try {
      const result = await compare.run({
        run_id: state.runId,
        domain: state.domain,
        fact_ids: state.factIds,
        key_only: state.keyOnly,
        search_profile: state.searchProfile,
      });
      setActiveRun({ runId: result.run_id, domain: result.domain });
      recordHistory(result, state.searchProfile, state.keyOnly);
      state.setControlBarCollapsed(true);
      state.clearVerdictFilters();
      state.setSelectedFactId(result.verdicts[0]?.fact_id ?? null);
    } catch (err) {
      showToast({
        kind: "error",
        message: err instanceof ApiClientError ? err.message : "Compare failed",
        detail: err instanceof ApiClientError ? err.detail : undefined,
      });
    }
  }

  const factOptions =
    compare.data?.verdicts.map((v) => ({
      factId: v.fact_id,
      qualifiedName: v.qualified_name,
      verdict: v.verdict,
    })) ?? [];

  const filtered =
    compare.data?.verdicts.filter((v) => {
      const matchesVerdict = state.verdictFilters.size === 0 || state.verdictFilters.has(v.verdict);
      const q = state.searchValue.toLowerCase();
      const matchesSearch =
        q === "" || v.qualified_name.toLowerCase().includes(q) || v.fact_id.toLowerCase().includes(q);
      return matchesVerdict && matchesSearch;
    }) ?? [];
  const visibleFacts = sortFacts(filtered);
  const selectedFact = compare.data?.verdicts.find((v) => v.fact_id === state.selectedFactId) ?? null;

  useKeyboardTriage({
    onSetSingleFilter: state.setSingleVerdictFilter,
    onClearFilters: () => {
      state.clearVerdictFilters();
      state.setSearchValue("");
    },
    onCopyFactId: () => {
      if (state.selectedFactId) navigator.clipboard.writeText(state.selectedFactId);
    },
    searchInputRef,
  });

  useEffect(() => {
    state.setHighlightedLocation(null);
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedFactId]);

  function handleLocationClick(location: string) {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    state.setHighlightedLocation(location);
    highlightTimeoutRef.current = setTimeout(() => {
      state.setHighlightedLocation(null);
      highlightTimeoutRef.current = null;
    }, 1600);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <ControlBar
        domains={domainsQuery.data?.domains ?? []}
        domain={state.domain}
        onDomainChange={state.setDomain}
        runs={runsQuery.data?.runs ?? []}
        runId={state.runId}
        onRunIdChange={state.setRunId}
        keyOnly={state.keyOnly}
        onKeyOnlyChange={state.setKeyOnly}
        searchProfile={state.searchProfile}
        onSearchProfileChange={state.setSearchProfile}
        factOptions={factOptions}
        factIds={state.factIds}
        onFactIdsChange={state.setFactIds}
        onCompare={handleCompare}
        comparing={compare.status === "loading"}
        collapsed={state.controlBarCollapsed}
        onEdit={() => state.setControlBarCollapsed(false)}
      />

      {compare.status === "loading" ? (
        <div className="p-lg">
          <ProgressCompare
            factsTotal={runsQuery.data?.runs.find((r) => r.run_id === state.runId)?.facts_total ?? 0}
            domain={state.domain}
            profile={state.searchProfile}
          />
        </div>
      ) : compare.data ? (
        <SummaryStrip
          summary={compare.data.summary}
          activeFilters={state.verdictFilters}
          onToggleFilter={state.toggleVerdictFilter}
          onClearFilters={state.clearVerdictFilters}
        />
      ) : null}

      <div className="flex-1 min-h-0 flex flex-col min-[1024px]:flex-row">
        {!compare.data && compare.status !== "loading" && (
          <EmptyState
            title="No compare run yet"
            description="Select a domain and run above, then choose Compare to see verdicts."
          />
        )}

        {compare.data && (
          <>
            <TriageList
              facts={visibleFacts}
              selectedFactId={state.selectedFactId}
              onSelectFact={state.setSelectedFactId}
              searchValue={state.searchValue}
              onSearchChange={state.setSearchValue}
              searchInputRef={searchInputRef}
            />
            <div className="flex-1 min-h-0 flex flex-col overflow-auto">
              {selectedFact ? (
                <>
                  <CompareLedger
                    fact={selectedFact}
                    code={buildLedgerCode(
                      selectedFact,
                      runsQuery.data?.runs.find((r) => r.run_id === state.runId)?.file_path ?? ""
                    )}
                    highlightedLocation={state.highlightedLocation}
                  />
                  <DiscrepancyStack fact={selectedFact} onLocationClick={handleLocationClick} />
                </>
              ) : (
                <EmptyState title="No fact selected" description="Choose a row from the triage list on the left." />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
