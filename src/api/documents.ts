import { apiGet, apiPost, apiPostForm } from "./client";
import type {
  DocumentRecord,
  UploadResponse,
  AskRequest,
  AskResponse,
} from "../types/domain";

export function listDocuments(): Promise<{ documents: DocumentRecord[] }> {
  return apiGet("/api/v1/documents/list");
}

export function uploadDocument(file: File, domain: string): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("domain", domain);
  return apiPostForm("/api/v1/documents/upload", form);
}

export function queryDocuments(payload: AskRequest): Promise<AskResponse> {
  return apiPost("/api/v1/documents/query", payload);
}
