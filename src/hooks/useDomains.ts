import { useEffect } from "react";
import { useAsync } from "./useAsync";
import { getDomains } from "../api/health";

export function useDomains() {
  const async_ = useAsync(getDomains);
  useEffect(() => {
    async_.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return async_;
}
