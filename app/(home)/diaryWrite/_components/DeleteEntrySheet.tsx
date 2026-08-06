import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";

type DeleteEntrySheetProps = {
  visible: boolean;
  isKo: boolean;
  onDelete: () => void;
  onClose: () => void;
};

export function DeleteEntrySheet({
  visible,
  isKo,
  onDelete,
  onClose,
}: DeleteEntrySheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={isKo ? "삭제하기" : "Delete"}
            style={styles.deleteRow}
          >
            <Ionicons name="trash-outline" size={20} color={palette.gray800} />
            <Typo.Body variant="body8" color="gray800">
              {isKo ? "삭제하기" : "Delete"}
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
