import { useCallback, useReducer } from "react";
import { ApiClientError } from "../api/client";
import { normalizeApiError, type NormalizedApiError } from "../api/errors";

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: NormalizedApiError | null;
}

type Action<T> =
  | { type: "start" }
  | { type: "success"; data: T }
  | { type: "error"; error: NormalizedApiError };

function reducer<T>(state: AsyncState<T>, action: Action<T>): AsyncState<T> {
  switch (action.type) {
    case "start":
      return { status: "loading", data: state.data, error: null };
    case "success":
      return { status: "success", data: action.data, error: null };
    case "error":
      return { status: "error", data: state.data, error: action.error };
  }
}

export function useAsync<T, A extends unknown[]>(fn: (...args: A) => Promise<T>) {
  const [state, dispatch] = useReducer(reducer<T>, {
    status: "idle",
    data: null,
    error: null,
  });

  const run = useCallback(
    async (...args: A) => {
      dispatch({ type: "start" });
      try {
        const data = await fn(...args);
        dispatch({ type: "success", data });
        return data;
      } catch (err) {
        const normalized =
          err instanceof ApiClientError
            ? { status: err.status, message: err.message, detail: err.detail }
            : normalizeApiError(err);
        dispatch({ type: "error", error: normalized });
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { ...state, run };
}
