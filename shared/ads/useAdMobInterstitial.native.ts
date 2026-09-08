import { useCallback, useEffect } from "react";
import { useInterstitialAd } from "react-native-google-mobile-ads";
import {
  type AdMobPlacement,
  getAdMobUnitId,
} from "@/shared/ads/adMobConfig";
import { initializeAdMob } from "@/shared/ads/initializeAdMob";
import type { AdMobFullScreenAdState } from "@/shared/ads/types";

export function useAdMobInterstitial(
  placement: AdMobPlacement,
): AdMobFullScreenAdState {
  const unitId = getAdMobUnitId(placement);
  const {
    error,
    isClicked,
    isClosed,
    isLoaded,
    isShowing,
    load,
    show,
  } = useInterstitialAd(unitId);

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

  useEffect(() => {
    if (!error) return;
    console.warn("[AdMob] interstitial ad load failed", {
      placement,
      unitId,
      message: error.message,
    });
  }, [error, placement, unitId]);

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
    load,
    showAd,
  };
}
