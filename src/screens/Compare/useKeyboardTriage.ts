import { useEffect, type RefObject } from "react";
import type { Verdict } from "../../types/domain";

const NUMBER_TO_VERDICT: Record<string, Verdict> = {
  "1": "Misaligned",
  "2": "Partial",
  "3": "Unrelated",
  "4": "Aligned",
};

interface Params {
  onSetSingleFilter: (v: Verdict) => void;
  onClearFilters: () => void;
  onCopyFactId: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export function useKeyboardTriage({ onSetSingleFilter, onClearFilters, onCopyFactId, searchInputRef }: Params) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (isTyping) {
        if (e.key === "Escape") target.blur();
        return;
      }
      if (e.key in NUMBER_TO_VERDICT) {
        onSetSingleFilter(NUMBER_TO_VERDICT[e.key]);
      } else if (e.key === "0") {
        onClearFilters();
      } else if (e.key === "c") {
        onCopyFactId();
      } else if (e.key === "Escape") {
        onClearFilters();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSetSingleFilter, onClearFilters, onCopyFactId, searchInputRef]);
}
