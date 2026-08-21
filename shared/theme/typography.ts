import type { TextStyle } from "react-native";

const fontFamily = {
  bold: "PretendardBold",
  semibold: "PretendardSemiBold",
  medium: "PretendardMedium",
  regular: "PretendardRegular",
} as const;

const textStyle = (
  fontSize: number,
  lineHeight: number,
  fontWeight: NonNullable<TextStyle["fontWeight"]>,
  family: string,
  letterSpacing = -0.02,
) => ({
  fontSize,
  lineHeight: fontSize * lineHeight,
  letterSpacing: fontSize * letterSpacing,
  fontWeight,
  fontFamily: family,
});

/** 기존 공용 Typo 컴포넌트와 화면이 함께 사용하는 Pretendard 토큰 */
export const typography = {
  display1: textStyle(24, 1.4, "700", fontFamily.bold),
  display2: textStyle(20, 1.4, "700", fontFamily.bold),
  display3: textStyle(18, 1.4, "700", fontFamily.bold),
  display4: textStyle(16, 1.4, "700", fontFamily.bold),
  display5: textStyle(9, 1.3, "700", fontFamily.bold, -0.03),

  head1: textStyle(20, 1.4, "600", fontFamily.semibold),
  head2: textStyle(18, 1.4, "600", fontFamily.semibold),

  body1: textStyle(16, 1.4, "600", fontFamily.semibold),
  body2: textStyle(15, 1.3, "600", fontFamily.semibold),
  body3: textStyle(14, 1.4, "600", fontFamily.semibold),
  body4: textStyle(13, 1.4, "600", fontFamily.semibold),
  body5: textStyle(12, 1.4, "600", fontFamily.semibold),
  body6: textStyle(11, 1.3, "600", fontFamily.semibold, -0.03),
  body7: textStyle(18, 1.4, "500", fontFamily.medium),
  body8: textStyle(16, 1.4, "500", fontFamily.medium),
  body9: textStyle(15, 1.4, "500", fontFamily.medium),
  body10: textStyle(14, 1.4, "500", fontFamily.medium),
  body11: textStyle(13, 1.4, "500", fontFamily.medium),
  body12: textStyle(12, 1.2, "500", fontFamily.medium),
  body13: textStyle(9, 1.3, "500", fontFamily.medium, -0.03),

  caption1: textStyle(14, 1.4, "400", fontFamily.regular),
  caption2: textStyle(13, 1.4, "400", fontFamily.regular),
  caption3: textStyle(12, 1.4, "400", fontFamily.regular),
} as const;
