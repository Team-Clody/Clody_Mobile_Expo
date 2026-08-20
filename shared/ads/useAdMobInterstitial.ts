import type { AdMobPlacement } from "@/shared/ads/adMobConfig";
import type { AdMobFullScreenAdState } from "@/shared/ads/types";

const noop = () => undefined;

export function useAdMobInterstitial(
  _placement: AdMobPlacement,
): AdMobFullScreenAdState {
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
