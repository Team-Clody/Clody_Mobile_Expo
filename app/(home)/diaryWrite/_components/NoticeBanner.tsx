import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/app/i18n/i18n";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";

type NoticeBannerProps = {
  onDismiss: () => void;
};

export function NoticeBanner({ onDismiss }: NoticeBannerProps) {
  return (
    <View style={styles.container}>
      <Typo.Body variant="body11" color="gray500" style={styles.message}>
        {i18n.t("diaryWrite.notice")}
      </Typo.Body>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={16} color={palette.gray400} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    backgroundColor: palette.gray30,
    borderRadius: 6,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 11,
    gap: 8,
  },
  message: {
    flex: 1,
  },
});
