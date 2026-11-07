import {
  type AdMobPlacement,
  getAdMobUnitId,
} from "@/shared/ads/adMobConfig";
import { useAdMobFullScreenAd } from "./useAdMobFullScreenAd";
import type { AdMobFullScreenAdState } from "@/shared/ads/types";

export function useAdMobInterstitial(placement: AdMobPlacement): AdMobFullScreenAdState {
  return useAdMobFullScreenAd("interstitial", getAdMobUnitId(placement));
}
