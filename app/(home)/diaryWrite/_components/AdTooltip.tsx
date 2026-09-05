import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import i18n from "@/app/i18n/i18n";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";

type AdTooltipProps = {
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

// 리스트 5개 도달 시 추가하기 버튼 중앙 위에 노출되는 말풍선 (Figma: progress bar/ic_말풍선)
export function AdTooltip({ disabled, onPress, style }: AdTooltipProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={disabled}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <View style={styles.bubble}>
        <Typo.Body variant="body5" color="gray0">
          {i18n.t("diaryWrite.adTooltipPrefix")}
        </Typo.Body>
        <Typo.Body variant="body5" color="#00D15A">
          {i18n.t("diaryWrite.adTooltipHighlight")}
        </Typo.Body>
        <Typo.Body variant="body5" color="gray0">
          {i18n.t("diaryWrite.adTooltipSuffix")}
        </Typo.Body>
      </View>
      <View style={styles.tail} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    height: 28,
    backgroundColor: palette.gray700,
    borderRadius: 999,
    paddingHorizontal: 10,
  },
  tail: {
    width: 0,
    height: 0,
    marginTop: -0.5,
    borderLeftWidth: 5.5,
    borderRightWidth: 5.5,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: palette.gray700,
  },
});
