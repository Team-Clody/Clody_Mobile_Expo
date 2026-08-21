import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import i18n from "@/app/i18n/i18n";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";

type AdTooltipProps = {
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

// 리스트 5개 도달 시 추가하기 버튼 위에 노출되는 말풍선 (3-1)
export function AdTooltip({ disabled, onPress, style }: AdTooltipProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={disabled}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <View style={styles.bubble}>
        <Typo.Caption variant="caption3" color="gray0">
          {i18n.t("diaryWrite.adTooltip")}
        </Typo.Caption>
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
    backgroundColor: palette.gray800,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tail: {
    width: 0,
    height: 0,
    marginTop: -0.5,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: palette.gray800,
  },
});
