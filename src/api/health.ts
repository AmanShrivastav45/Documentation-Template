import { apiGet } from "./client";
import type { HealthStatus, DomainsResponse } from "../types/domain";

export function getHealth(): Promise<{ status: string }> {
  return apiGet("/api/v1/health");
}

export function getDomains(): Promise<DomainsResponse> {
  return apiGet("/api/v1/documents/domains");
}

export type { HealthStatus };
