import { useAsync } from "./useAsync";
import { ingestCode } from "../api/code";
import type { ExtractRequest } from "../types/domain";

export function useIngest() {
  return useAsync((payload: ExtractRequest) => ingestCode(payload));
}
