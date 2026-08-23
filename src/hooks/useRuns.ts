import { useCallback, useEffect } from "react";
import { useAsync } from "./useAsync";
import { listCodeRuns } from "../api/code";

export function useRuns() {
  const async_ = useAsync(listCodeRuns);
  useEffect(() => {
    async_.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refresh = useCallback(() => async_.run(), [async_.run]);
  return { ...async_, refresh };
}
