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
  load: () => void;
  showAd: () => boolean;
};

export type AdMobRewardedAdState = AdMobFullScreenAdState & {
  reward?: AdMobReward;
  isEarnedReward?: boolean;
};
