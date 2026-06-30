import { StyleSheet, TextStyle } from "react-native";

export const fontPreset = StyleSheet.create({
  regular: { fontFamily: "PretendardRegular" },
  medium: { fontFamily: "PretendardMedium" },
  semibold: { fontFamily: "PretendardSemiBold" },
  bold: { fontFamily: "PretendardBold" },
});

type LocaleWeightPair = {
  ko: NonNullable<TextStyle["fontWeight"]>;
  en: NonNullable<TextStyle["fontWeight"]>;
};

/** 한·영 로케일별 fontWeight — KO는 Pretendard optical weight, EN은 한 단계 낮게 */
export const localeFontWeights = {
  /** 헤더 액션 (오늘 | 월별) — KO Medium / EN Regular */
  headerAction: { ko: "500", en: "400" },
  /** 클로버 카운트 — KO Semibold / EN Medium */
  cloverCount: { ko: "600", en: "500" },
  /** 레벨 칩 — KO Bold / EN Semibold */
  levelChip: { ko: "700", en: "600" },
} as const satisfies Record<string, LocaleWeightPair>;

export type LocaleFontWeightKey = keyof typeof localeFontWeights;

export function localeFontWeight(
  key: LocaleFontWeightKey,
  isKo: boolean,
): { fontWeight: NonNullable<TextStyle["fontWeight"]> } {
  const pair = localeFontWeights[key];
  return { fontWeight: isKo ? pair.ko : pair.en };
}

export function localeFontFamily(
  key: LocaleFontWeightKey,
  isKo: boolean,
): TextStyle {
  switch (key) {
    case "headerAction":
      return isKo ? fontPreset.medium : fontPreset.regular;
    case "cloverCount":
      return isKo ? fontPreset.semibold : fontPreset.medium;
    case "levelChip":
      return isKo ? fontPreset.bold : fontPreset.semibold;
  }
}

export function localeTextStyle(
  key: LocaleFontWeightKey,
  isKo: boolean,
  extra?: TextStyle,
): TextStyle[] {
  return [localeFontFamily(key, isKo), localeFontWeight(key, isKo), ...(extra ? [extra] : [])];
}
