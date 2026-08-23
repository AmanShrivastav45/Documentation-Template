import { useState } from "react";
import type { SearchProfile, Verdict } from "../../types/domain";

export function useCompareState() {
  const [domain, setDomain] = useState("");
  const [runId, setRunId] = useState("");
  const [keyOnly, setKeyOnly] = useState(false);
  const [searchProfile, setSearchProfile] = useState<SearchProfile>("balanced");
  const [factIds, setFactIds] = useState<string[] | null>(null);
  const [controlBarCollapsed, setControlBarCollapsed] = useState(false);
  const [verdictFilters, setVerdictFilters] = useState<Set<Verdict>>(new Set());
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [highlightedLocation, setHighlightedLocation] = useState<string | null>(null);

  function toggleVerdictFilter(v: Verdict) {
    setVerdictFilters((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }

  function setSingleVerdictFilter(v: Verdict) {
    setVerdictFilters(new Set([v]));
  }

  function clearVerdictFilters() {
    setVerdictFilters(new Set());
  }

  return {
    domain, setDomain,
    runId, setRunId,
    keyOnly, setKeyOnly,
    searchProfile, setSearchProfile,
    factIds, setFactIds,
    controlBarCollapsed, setControlBarCollapsed,
    verdictFilters, toggleVerdictFilter, setSingleVerdictFilter, clearVerdictFilters,
    selectedFactId, setSelectedFactId,
    searchValue, setSearchValue,
    highlightedLocation, setHighlightedLocation,
  };
}

export type CompareState = ReturnType<typeof useCompareState>;
