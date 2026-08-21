import type { AdMobPlacement } from "@/shared/ads/adMobConfig";
import type { AdMobRewardedAdState } from "@/shared/ads/types";

const noop = () => undefined;

export function useAdMobRewarded(
  _placement: AdMobPlacement,
): AdMobRewardedAdState {
  return {
    unitId: null,
    isLoaded: false,
    isShowing: false,
    isClosed: false,
    isClicked: false,
    load: noop,
    showAd: () => false,
  };
}
