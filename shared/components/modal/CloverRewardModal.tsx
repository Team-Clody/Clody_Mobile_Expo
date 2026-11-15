import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import CloverIcon from "@/assets/icons/ic_clover.svg";
import i18n from "@/app/i18n/i18n";
import { palette } from "@/shared/theme/palette";
import { typography } from "@/shared/theme/typography";
import type { getCloverMissionProgress } from "@/services/replyOpenService";

type Props = {
  visible: boolean;
  progress: ReturnType<typeof getCloverMissionProgress> | null;
  onConfirm: () => void;
};

export function CloverRewardModal({ visible, progress, onConfirm }: Props) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onConfirm}>
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={styles.image}><CloverIcon width={110} height={110} /></View>
          <View style={styles.text}>
            <Text style={styles.title}>{i18n.t("reply.reward.title")}</Text>
            <Text style={styles.description}>
              {progress ? i18n.t("reply.reward.description", progress) : i18n.t("reply.reward.descriptionFallback")}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onConfirm} style={styles.confirm}>
            <Text style={styles.confirmText}>{i18n.t("reply.reward.confirm")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  dialog: { width: 212, maxWidth: "90%", alignItems: "center", borderRadius: 12, backgroundColor: palette.gray0, paddingTop: 20, paddingHorizontal: 16, paddingBottom: 16 },
  image: { width: 110, height: 110, alignItems: "center", justifyContent: "center" },
  text: { alignItems: "center", gap: 4, marginTop: 9 },
  title: { ...typography.display4, color: "#282A31", textAlign: "center" },
  description: { ...typography.body12, color: palette.gray500, textAlign: "center" },
  confirm: { alignSelf: "stretch", minHeight: 40, marginTop: 16, paddingVertical: 9, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: palette.gray50 },
  confirmText: { ...typography.body3, color: palette.gray900 },
});
