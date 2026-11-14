import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { SkinAPI } from "@/api/skinAPI";
import type { GetSkinStatusListResponseDTO } from "@/api/dto/skin/response/getSkinStatusListResponseDTO";

/** The server owns the current stage and cumulative target, including later stages. */
export function useCloverSummary(enabled: boolean) {
  const [summary, setSummary] = useState<GetSkinStatusListResponseDTO | null>(null);
  useFocusEffect(useCallback(() => {
    if (!enabled) { setSummary(null); return; }
    let active = true;
    void SkinAPI.getSkinStatusList().then((data) => {
      if (active) setSummary(data);
    }).catch(() => { /* Retain the last confirmed summary while offline. */ });
    return () => { active = false; };
  }, [enabled]));
  return summary;
}
