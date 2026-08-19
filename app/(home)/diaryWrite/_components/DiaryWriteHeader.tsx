import { Pressable, StyleSheet, View } from "react-native";
import i18n from "@/app/i18n/i18n";
import { Icon } from "@/shared/components/Icon";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";

type DiaryWriteHeaderProps = {
  onPressBack: () => void;
  onPressSaveDraft: () => void;
  onPressSend: () => void;
};

export function DiaryWriteHeader({
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
        accessibilityLabel={i18n.t("diaryWrite.back")}
        style={styles.backButton}
      >
        <Icon.IcBack width={28} height={28} />
      </Pressable>

      <View style={styles.actions}>
        <Pressable onPress={onPressSaveDraft} hitSlop={8}>
          <Typo.Body variant="body3" color="gray400">
            {i18n.t("diaryWrite.saveDraft")}
          </Typo.Body>
        </Pressable>
        <View style={styles.divider} />
        <Pressable onPress={onPressSend} hitSlop={8}>
          <Typo.Body variant="body3" color="accentPrimary500">
            {i18n.t("diaryWrite.send")}
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
