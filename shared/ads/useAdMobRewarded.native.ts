import { useCallback, useEffect } from "react";
import { useRewardedAd } from "react-native-google-mobile-ads";
import {
  type AdMobPlacement,
  getAdMobUnitId,
} from "@/shared/ads/adMobConfig";
import { initializeAdMob } from "@/shared/ads/initializeAdMob";
import type { AdMobRewardedAdState } from "@/shared/ads/types";

export function useAdMobRewarded(
  placement: AdMobPlacement,
): AdMobRewardedAdState {
  const unitId = getAdMobUnitId(placement);
  const {
    error,
    isClicked,
    isClosed,
    isEarnedReward,
    isLoaded,
    isShowing,
    load,
    reward,
    show,
  } = useRewardedAd(unitId);

  useEffect(() => {
    let cancelled = false;

    initializeAdMob()
      .then(() => {
        if (!cancelled) load();
      })
      .catch((error) => console.warn("[AdMob] initialize failed", error));

    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    if (isClosed || error) {
      load();
    }
  }, [error, isClosed, load]);

  const showAd = useCallback(() => {
    if (isShowing) return false;
    if (!isLoaded) {
      load();
      return false;
    }

    show();
    return true;
  }, [isLoaded, isShowing, load, show]);

  return {
    unitId,
    isLoaded,
    isShowing,
    isClosed,
    isClicked,
    error,
    reward,
    isEarnedReward,
    load,
    showAd,
  };
}
