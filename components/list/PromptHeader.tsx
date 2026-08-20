import i18n from "@/app/i18n/i18n";
import { Icon } from "@/shared/components/Icon";
import { HStack } from "@/shared/components/stack/HStack";
import { VStack } from "@/shared/components/stack/VStack";
import { Typo } from "@/shared/components/typo/Typo";
import { palette } from "@/shared/theme/palette";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

const FIGMA_SCREEN_WIDTH = 375;
const FIGMA_PROMPT_COPY_WIDTH = 210;

interface PromptHeaderProps {
  prompt?: string;
  onPressWrite?: () => void;
}

export function PromptHeader({ prompt, onPressWrite }: PromptHeaderProps) {
  const { width: screenWidth } = useWindowDimensions();
  const promptText = prompt?.trim() || i18n.t("list.promptFallback");
  const promptCopyWidth =
    (FIGMA_PROMPT_COPY_WIDTH / FIGMA_SCREEN_WIDTH) * screenWidth;

  return (
    <VStack style={styles.card}>
      <VStack style={styles.content}>
        <HStack alignment={10} style={styles.promptRow}>
          <VStack style={[styles.copy, { width: promptCopyWidth }]}>
            <HStack alignment={4} style={styles.eyebrow}>
              <Icon.IcStars width={18} height={18} />
              <Typo.Body variant="body5" style={styles.eyebrowText}>
                {i18n.t("list.promptTitle")}
              </Typo.Body>
            </HStack>

            <MaskedView
              style={styles.promptMask}
              maskElement={
                <Typo.Display variant="display4" style={styles.promptText}>
                  {promptText}
                </Typo.Display>
              }
            >
              <LinearGradient
                colors={["#004926", palette.gray800]}
                locations={[0, 0.7026]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
              >
                <Typo.Display
                  variant="display4"
                  style={[styles.promptText, styles.hiddenText]}
                >
                  {promptText}
                </Typo.Display>
              </LinearGradient>
            </MaskedView>
          </VStack>

          <Image
            source={require("@/assets/images/img_lody_prompt.png")}
            style={styles.lody}
            resizeMode="contain"
          />
        </HStack>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={i18n.t("list.writeToday")}
          onPress={onPressWrite}
        >
          <LinearGradient
            colors={["#5EC091", palette.accentPrimary500]}
            locations={[0.031, 0.9974]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.writeButton}
          >
            <Typo.Body variant="body5" style={styles.writeButtonText}>
              {i18n.t("list.writeToday")}
            </Typo.Body>
          </LinearGradient>
        </Pressable>
      </VStack>
    </VStack>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F2F2F2",
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
  },
  content: {
    gap: 12,
  },
  promptRow: {
    paddingRight: 12,
  },
  copy: {
    gap: 4,
  },
  eyebrow: {
    height: 18,
    gap: 4,
  },
  eyebrowText: {
    color: "#13B567",
  },
  promptMask: {
    alignSelf: "stretch",
  },
  promptText: {
    color: palette.gray800,
  },
  hiddenText: {
    opacity: 0,
  },
  lody: {
    width: 63.28,
    height: 57.4,
  },
  writeButton: {
    height: 36,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  writeButtonText: {
    color: palette.gray0,
    textAlign: "center",
  },
});
