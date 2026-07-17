import { useEffect, useState } from "react";
import { captureUtmFirstTouch, getStoredUtm, type UtmParams } from "@/lib/tracking/utm";

/**
 * Captures UTMs from URL on first visit (first-touch, no overwrite) and
 * returns the persisted values. Safe on SSR (returns empty until mounted).
 */
export function useUtmParams(): UtmParams {
  const [utm, setUtm] = useState<UtmParams>({});
  useEffect(() => {
    const captured = captureUtmFirstTouch();
    const stored = getStoredUtm();
    setUtm({ ...stored, ...captured });
  }, []);
  return utm;
}
