import i18n from "@/app/i18n/i18n";
import { palette } from "@/shared/theme/palette";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typo } from "./typo/Typo";

type DeleteActionSheetProps = {
  visible: boolean;
  onDelete: () => void;
  onClose: () => void;
  disabled?: boolean;
};

export function DeleteActionSheet({
  visible,
  onDelete,
  onClose,
  disabled = false,
}: DeleteActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={i18n.t("diaryWrite.delete")}
            accessibilityState={{ disabled }}
            disabled={disabled}
            style={[styles.deleteRow, disabled && styles.disabled]}
          >
            <Ionicons name="trash-outline" size={20} color={palette.gray800} />
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
  disabled: {
    opacity: 0.5,
  },
});
