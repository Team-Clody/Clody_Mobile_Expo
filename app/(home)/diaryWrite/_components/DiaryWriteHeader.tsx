import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/shared/components/Icon";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";

type DiaryWriteHeaderProps = {
  isKo: boolean;
  onPressBack: () => void;
  onPressSaveDraft: () => void;
  onPressSend: () => void;
};

export function DiaryWriteHeader({
  isKo,
  onPressBack,
  onPressSaveDraft,
  onPressSend,
}: DiaryWriteHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPressBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={isKo ? "뒤로가기" : "Go back"}
        style={styles.backButton}
      >
        <Icon.IcBack width={28} height={28} />
      </Pressable>

      <View style={styles.actions}>
        <Pressable onPress={onPressSaveDraft} hitSlop={8}>
          <Typo.Body variant="body3" color="gray400">
            {isKo ? "임시저장" : "Save draft"}
          </Typo.Body>
        </Pressable>
        <View style={styles.divider} />
        <Pressable onPress={onPressSend} hitSlop={8}>
          <Typo.Body variant="body3" color="accentPrimary500">
            {isKo ? "보내기" : "Send"}
          </Typo.Body>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: palette.gray100,
  },
});
