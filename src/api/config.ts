const BASE_URL_KEY = "mvc.apiBaseUrl";
const TIMEOUT_KEY = "mvc.apiTimeoutMs";

export function getApiBaseUrl(): string {
  return localStorage.getItem(BASE_URL_KEY) ?? (import.meta.env.VITE_MVC_API_BASE_URL as string);
}

export function setApiBaseUrl(url: string): void {
  localStorage.setItem(BASE_URL_KEY, url);
}

export function getApiTimeoutMs(): number {
  const stored = localStorage.getItem(TIMEOUT_KEY);
  return stored ? Number(stored) : Number(import.meta.env.VITE_MVC_API_TIMEOUT_MS ?? 60000);
}

export function setApiTimeoutMs(ms: number): void {
  localStorage.setItem(TIMEOUT_KEY, String(ms));
}
