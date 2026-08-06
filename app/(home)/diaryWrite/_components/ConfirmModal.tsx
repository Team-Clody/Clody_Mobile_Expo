import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  // 보내기 팝업은 green, 임시저장 팝업은 dark
  confirmVariant: "green" | "dark";
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  visible,
  title,
  description,
  cancelLabel,
  confirmLabel,
  confirmVariant,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const confirmBackground =
    confirmVariant === "green" ? palette.accentPrimary500 : palette.gray800;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Typo.Display variant="display3" color="gray1000" style={styles.title}>
            {title}
          </Typo.Display>
          <Typo.Caption
            variant="caption1"
            color="gray500"
            style={styles.description}
          >
            {description}
          </Typo.Caption>

          <View style={styles.buttonWrapper}>
            <Pressable
              onPress={onCancel}
              style={[styles.button, { backgroundColor: palette.gray100 }]}
            >
              <Typo.Body variant="body3" color="gray500">
                {cancelLabel}
              </Typo.Body>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.button, { backgroundColor: confirmBackground }]}
            >
              <Typo.Body variant="body3" color="gray0">
                {confirmLabel}
              </Typo.Body>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    marginHorizontal: 24,
    alignSelf: "stretch",
    backgroundColor: palette.gray0,
    borderRadius: 12,
  },
  title: {
    marginTop: 18,
    textAlign: "center",
  },
  description: {
    marginTop: 10,
    textAlign: "center",
  },
  buttonWrapper: {
    flexDirection: "row",
    width: "100%",
    padding: 18,
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 11,
  },
});
