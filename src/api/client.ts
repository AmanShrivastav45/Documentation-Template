import { normalizeApiError, type NormalizedApiError } from "./errors";
import { getApiBaseUrl, getApiTimeoutMs } from "./config";

export class ApiClientError extends Error {
  status?: number;
  detail?: unknown;
  constructor(normalized: NormalizedApiError) {
    super(normalized.message);
    this.status = normalized.status;
    this.detail = normalized.detail;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const timeoutMs = getApiTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers:
        init?.body instanceof FormData
          ? init?.headers
          : { "Content-Type": "application/json", ...init?.headers },
    });

    if (!res.ok) {
      let detail: unknown;
      try {
        const body = await res.json();
        detail = body?.detail ?? body;
      } catch {
        detail = res.statusText;
      }
      throw new ApiClientError(normalizeApiError({ status: res.status, detail }));
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiClientError({
        status: undefined,
        message: `Request timed out after ${timeoutMs}ms`,
      });
    }
    throw new ApiClientError(normalizeApiError(err));
  } finally {
    clearTimeout(timeout);
  }
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPostForm<T>(path: string, form: FormData): Promise<T> {
  return request<T>(path, { method: "POST", body: form });
}
