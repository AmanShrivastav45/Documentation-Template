import { useAsync } from "./useAsync";
import { uploadDocument } from "../api/documents";

export function useUpload() {
  return useAsync((file: File, domain: string) => uploadDocument(file, domain));
}
