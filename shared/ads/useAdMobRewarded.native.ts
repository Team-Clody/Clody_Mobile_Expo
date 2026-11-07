import {
  type AdMobPlacement,
  getAdMobUnitId,
} from "@/shared/ads/adMobConfig";
import { useAdMobFullScreenAd } from "./useAdMobFullScreenAd";
import type { AdMobRewardedAdState } from "@/shared/ads/types";

export function useAdMobRewarded(placement: AdMobPlacement): AdMobRewardedAdState {
  return useAdMobFullScreenAd("rewarded", getAdMobUnitId(placement));
}
