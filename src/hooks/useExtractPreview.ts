import { useAsync } from "./useAsync";
import { extractCode } from "../api/code";
import type { ExtractRequest } from "../types/domain";

export function useExtractPreview() {
  return useAsync((payload: ExtractRequest) => extractCode(payload));
}
