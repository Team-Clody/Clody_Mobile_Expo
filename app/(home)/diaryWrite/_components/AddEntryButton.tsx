import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import i18n from "@/app/i18n/i18n";
import { Icon } from "@/shared/components/Icon";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";

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
  const backgroundColor = disabled ? palette.gray300 : palette.accentPrimary500;

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
        <Icon.IcPlus width={12} height={12} />
        <Typo.Body variant="body3" color="gray0">
          {i18n.t("diaryWrite.add")}
        </Typo.Body>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 24,
    height: 44,
    paddingHorizontal: 18,
    justifyContent: "center",
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 2,
        blurRadius: 8,
        color: "rgba(0, 0, 0, 0.12)",
      },
    ],
  },
  pillContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 2,
        blurRadius: 8,
        color: "rgba(0, 0, 0, 0.12)",
      },
    ],
  },
});
