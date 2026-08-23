export interface NormalizedApiError {
  status: number | undefined;
  message: string;
  detail?: unknown;
}

export function normalizeApiError(err: unknown): NormalizedApiError {
  const anyErr = err as {
    status?: number;
    detail?: unknown;
    response?: { status?: number; data?: { detail?: unknown } };
  };
  const status = anyErr?.status ?? anyErr?.response?.status;
  const detail = anyErr?.detail ?? anyErr?.response?.data?.detail;

  if (typeof detail === "string") {
    return { status, message: detail, detail };
  }

  if (detail && typeof detail === "object") {
    const msg =
      (detail as { message?: string }).message ??
      (Array.isArray(detail) && detail[0]?.message) ??
      "Request failed";
    return { status, message: msg, detail };
  }

  if (err instanceof Error) {
    return { status, message: err.message, detail };
  }

  return { status, message: "Unexpected API error", detail };
}
