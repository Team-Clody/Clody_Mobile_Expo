import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";

type NoticeBannerProps = {
  isKo: boolean;
  onDismiss: () => void;
};

export function NoticeBanner({ isKo, onDismiss }: NoticeBannerProps) {
  return (
    <View style={styles.container}>
      <Typo.Caption variant="caption2" color="gray500" style={styles.message}>
        {isKo
          ? "신조어, 비속어, 이모지 작성은 제외하고 작성해 주세요."
          : "Please write without slang, profanity, or emojis."}
      </Typo.Caption>
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
    backgroundColor: palette.gray50,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  message: {
    flex: 1,
  },
});
