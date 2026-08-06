import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";

type AddEntryButtonProps = {
  isKo: boolean;
  // 키보드 노출 중에는 원형 + 버튼으로 전환
  compact: boolean;
  disabled: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

export function AddEntryButton({
  isKo,
  compact,
  disabled,
  onPress,
  style,
}: AddEntryButtonProps) {
  const backgroundColor = disabled ? palette.gray300 : palette.accentPrimary500;
  const textColor = "gray0";

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[styles.fab, { backgroundColor }, style]}
      >
        <Typo.Head variant="head1" color={textColor} style={styles.fabPlus}>
          +
        </Typo.Head>
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
        <Typo.Body variant="body1" color={textColor}>
          +
        </Typo.Body>
        <Typo.Body variant="body3" color={textColor}>
          {isKo ? "추가하기" : "Add"}
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
  fabPlus: {
    marginTop: -2,
  },
});
