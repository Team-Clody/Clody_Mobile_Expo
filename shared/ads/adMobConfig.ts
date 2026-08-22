import Constants from "expo-constants";
import { Platform } from "react-native";

declare const __DEV__: boolean;

export const ADMOB_APP_ID = "ca-app-pub-6721111543239153~7854886391";

export const ADMOB_PLACEMENTS = {
  extraDiaryInterstitial: "extraDiaryInterstitial",
  fastReplyReward: "fastReplyReward",
} as const;

export type AdMobPlacement = keyof typeof ADMOB_PLACEMENTS;

const PRODUCTION_AD_UNIT_IDS: Record<
  "android" | "ios",
  Record<AdMobPlacement, string>
> = {
  android: {
    extraDiaryInterstitial: "ca-app-pub-6721111543239153/7712010610",
    fastReplyReward: "ca-app-pub-6721111543239153/8020745222",
  },
  ios: {
    extraDiaryInterstitial: "ca-app-pub-6721111543239153/7712010610",
    fastReplyReward: "ca-app-pub-6721111543239153/8020745222",
  },
};

const TEST_AD_UNIT_IDS: Record<"android" | "ios", Record<AdMobPlacement, string>> = {
  android: {
    extraDiaryInterstitial: "ca-app-pub-3940256099942544/1033173712",
    fastReplyReward: "ca-app-pub-3940256099942544/5224354917",
  },
  ios: {
    extraDiaryInterstitial: "ca-app-pub-3940256099942544/4411468910",
    fastReplyReward: "ca-app-pub-3940256099942544/1712485313",
  },
};

type AdMobExtraConfig = {
  admobUseTestAds?: boolean | string;
};

function parseBooleanOverride(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return undefined;
}

export function shouldUseAdMobTestIds() {
  const extra = Constants.expoConfig?.extra as AdMobExtraConfig | undefined;
  const override = parseBooleanOverride(extra?.admobUseTestAds);
  if (override !== undefined) return override;
  return __DEV__;
}

export function getAdMobUnitId(placement: AdMobPlacement) {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const adUnitIds = shouldUseAdMobTestIds()
    ? TEST_AD_UNIT_IDS
    : PRODUCTION_AD_UNIT_IDS;

  return adUnitIds[platform][placement];
}
