import { Modal, Pressable, StyleSheet, View } from "react-native";
import i18n from "@/app/i18n/i18n";
import { Icon } from "@/shared/components/Icon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";

type DeleteEntrySheetProps = {
  visible: boolean;
  onDelete: () => void;
  onClose: () => void;
};

export function DeleteEntrySheet({
  visible,
  onDelete,
  onClose,
}: DeleteEntrySheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // 안드로이드 모달 창은 기본적으로 시스템 바 안쪽에서 끝나 insets.bottom이 이중으로 더해짐
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={i18n.t("diaryWrite.delete")}
            style={styles.deleteRow}
          >
            <Icon.IcTrash width={34} height={34} />
            <Typo.Body variant="body8" color="gray800">
              {i18n.t("diaryWrite.delete")}
            </Typo.Body>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: palette.gray0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.gray200,
    marginBottom: 10,
  },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
  },
});
