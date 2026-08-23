import type { CompareResponse, SearchProfile } from "../types/domain";

const STORAGE_KEY = "mvc.history";
const MAX_ENTRIES = 50;

export interface HistoryEntry {
  id: string;
  response: CompareResponse;
  search_profile: SearchProfile;
  key_only: boolean;
  saved_at: string;
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordHistory(response: CompareResponse, searchProfile: SearchProfile, keyOnly: boolean): void {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    response,
    search_profile: searchProfile,
    key_only: keyOnly,
    saved_at: new Date().toISOString(),
  };
  const next = [entry, ...getHistory()].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportEntryAsJson(entry: HistoryEntry): void {
  const blob = new Blob([JSON.stringify(entry.response, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${entry.response.run_id}_${entry.id}.json`);
}

export function exportEntryAsCsv(entry: HistoryEntry): void {
  const header = "fact_id,qualified_name,fact_type,verdict,confidence,reasoning\n";
  const rows = entry.response.verdicts
    .map((v) =>
      [v.fact_id, v.qualified_name, v.fact_type, v.verdict, String(v.confidence), v.reasoning.replace(/"/g, '""')]
        .map((cell) => `"${cell}"`)
        .join(",")
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  downloadBlob(blob, `${entry.response.run_id}_${entry.id}.csv`);
}
