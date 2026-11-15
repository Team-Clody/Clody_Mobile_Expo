import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { SkinAPI } from "@/api/skinAPI";
import type { GetEquippedSkinResponseDTO } from "@/api/dto/skin/response/getEquippedSkinResponseDTO";

/** Refresh the server's equipped appearance whenever the home becomes active. */
export function useEquippedSkin(enabled = true) {
  const [skin, setSkin] = useState<GetEquippedSkinResponseDTO | null>(null);
  useFocusEffect(useCallback(() => {
    if (!enabled) {
      setSkin(null);
      return;
    }
    let active = true;
    void SkinAPI.getEquippedSkin().then((equipped) => {
      if (active) setSkin(equipped);
    }).catch(() => {
      // Preserve the last successful appearance on a temporary network error.
    });
    return () => { active = false; };
  }, [enabled]));
  return skin;
}
