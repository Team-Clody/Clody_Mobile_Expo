export type AdMobReward = {
  amount: number;
  type: string;
};

export type AdMobFullScreenAdState = {
  unitId: string | null;
  isLoaded: boolean;
  isShowing: boolean;
  isClosed: boolean;
  isClicked: boolean;
  error?: Error;
  /** False when a retry cooldown or active presentation blocks loading. */
  load: () => boolean;
  /** True when presentation was requested; asynchronous failures set error. */
  showAd: () => boolean;
};

export type AdMobRewardedAdState = AdMobFullScreenAdState & {
  reward?: AdMobReward;
  isEarnedReward?: boolean;
};
