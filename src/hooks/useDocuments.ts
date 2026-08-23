import { useCallback, useEffect } from "react";
import { useAsync } from "./useAsync";
import { listDocuments } from "../api/documents";

export function useDocuments() {
  const async_ = useAsync(listDocuments);
  useEffect(() => {
    async_.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refresh = useCallback(() => async_.run(), [async_.run]);
  return { ...async_, refresh };
}
