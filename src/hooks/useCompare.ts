import { useAsync } from "./useAsync";
import { runCompare } from "../api/compare";
import type { CompareRequest } from "../types/domain";

export function useCompare() {
  return useAsync((payload: CompareRequest) => runCompare(payload));
}
