import { apiGet, apiPost } from "./client";
import type {
  CodeRun,
  ExtractRequest,
  ExtractResponse,
  IngestResponse,
} from "../types/domain";

export function listCodeRuns(): Promise<{ runs: CodeRun[] }> {
  return apiGet("/api/v1/code/runs");
}

export function extractCode(payload: ExtractRequest): Promise<ExtractResponse> {
  return apiPost("/api/v1/code/extract", payload);
}

export function ingestCode(payload: ExtractRequest): Promise<IngestResponse> {
  return apiPost("/api/v1/code/ingest", payload);
}
