import { useSyncExternalStore } from "react";
import { getAdMobFullScreenAdController } from "./adMobFullScreenAdController";

export function useAdMobFullScreenAd(kind: "interstitial" | "rewarded", unitId: string) {
  const controller = getAdMobFullScreenAdController(kind, unitId);
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  return { ...state, load: controller.load, showAd: controller.showAd };
}
