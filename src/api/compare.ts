import { apiPost } from "./client";
import type { CompareRequest, CompareResponse } from "../types/domain";

export function runCompare(payload: CompareRequest): Promise<CompareResponse> {
  return apiPost("/api/v1/compare", payload);
}
