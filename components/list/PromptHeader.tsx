import { Icon } from "@/shared/components";
import { HStack } from "@/shared/components/stack/HStack";
import { VStack } from "@/shared/components/stack/VStack";
import { Typo } from "@/shared/components/typo/Typo";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable } from "react-native";

interface PromptHeaderProps {
  prompt?: string;
}

export function PromptHeader({ prompt }: PromptHeaderProps) {
  const promptText =
    prompt || `"버텨줘서 고마워"라고 말해주고 싶은 나의 모습을 적어보세요`;

  return (
    <VStack
      style={{
        padding: 16,
        gap: 10,
        backgroundColor: "#F8F9FA",
        borderWidth: 1,
        borderColor: "#F2F2F2",
        borderRadius: 8,
        marginHorizontal: 20,
      }}
    >
      <VStack style={{ gap: 12 }}>
        <HStack
          alignment={10}
          style={{
            paddingRight: 12,
            gap: 12,
          }}
        >
          <VStack style={{ gap: 4, flex: 1, flexShrink: 1 }}>
            <HStack alignment={4} style={{ gap: 4 }}>
              <Icon.IcStars width={18} height={18} />
              <Typo.Body variant="body5" style={{ color: "#13B567" }}>
                오늘의 감사 추천
              </Typo.Body>
            </HStack>

            <MaskedView
              maskElement={
                <Typo.Display
                  variant="display4"
                  style={{ backgroundColor: "transparent" }}
                >
                  {promptText}
                </Typo.Display>
              }
            >
              <LinearGradient
                colors={["#004926", "#293038"]}
                locations={[0, 0.7026]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
              >
                <Typo.Display variant="display4" style={{ opacity: 0 }}>
                  {promptText}
                </Typo.Display>
              </LinearGradient>
            </MaskedView>
          </VStack>

          <Image
            source={require("@/assets/images/img_lody_prompt.png")}
            style={{ width: 63, height: 57 }}
            resizeMode="contain"
          />
        </HStack>

        <Pressable onPress={() => alert("Button Pressed")}>
          <LinearGradient
            colors={["#5EC091", "#1C9D5F"]}
            locations={[0.031, 0.9974]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              paddingVertical: 9,
              borderRadius: 7,
              justifyContent: "center",
              alignItems: "center",
              alignSelf: "stretch",
            }}
          >
            <Typo.Body
              variant="body5"
              style={{ color: "#FFFFFF", textAlign: "center" }}
            >
              오늘 일기쓰기
            </Typo.Body>
          </LinearGradient>
        </Pressable>
      </VStack>
    </VStack>
  );
}
