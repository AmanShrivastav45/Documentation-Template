import { useEffect } from "react";
import { useAsync } from "./useAsync";
import { getHealth } from "../api/health";

export function useHealth() {
  const async_ = useAsync(getHealth);
  useEffect(() => {
    async_.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return async_;
}
