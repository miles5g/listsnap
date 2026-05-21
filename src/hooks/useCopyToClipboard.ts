import { useCallback } from "react";
import { toast } from "sonner";

export function useCopyToClipboard() {
  return useCallback(async (text: string, fieldName: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${fieldName} to clipboard!`);
  }, []);
}
