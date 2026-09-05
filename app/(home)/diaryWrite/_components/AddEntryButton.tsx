import i18n from "@/app/i18n/i18n";
import { Icon } from "@/shared/components/Icon";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";

type AddEntryButtonProps = {
  // 키보드 노출 중에는 원형 + 버튼으로 전환
  compact: boolean;
  disabled: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

export function AddEntryButton({
  compact,
  disabled,
  onPress,
  style,
}: AddEntryButtonProps) {
  const backgroundColor = disabled ? palette.gray300 : palette.accentPrimary450;

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[styles.fab, { backgroundColor }, style]}
      >
        <Icon.IcPlus width={14} height={14} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.pill, { backgroundColor }, style]}
    >
      <View style={styles.pillContent}>
        <Icon.IcPlus width={16} height={16} />
        <Typo.Body variant="body3" color="white">
          {i18n.t("diaryWrite.add")}
        </Typo.Body>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 24,
    height: 42,
    paddingHorizontal: 14,
    justifyContent: "center",
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 0,
        blurRadius: 20,
        color: "rgba(0, 0, 0, 0.1)",
      },
    ],
  },
  pillContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fab: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 0,
        blurRadius: 20,
        color: "rgba(0, 0, 0, 0.1)",
      },
    ],
  },
});
