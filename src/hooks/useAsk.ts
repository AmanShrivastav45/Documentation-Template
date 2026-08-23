import { useAsync } from "./useAsync";
import { queryDocuments } from "../api/documents";
import type { AskRequest } from "../types/domain";

export function useAsk() {
  return useAsync((payload: AskRequest) => queryDocuments(payload));
}
