import { Icon } from "@/shared/components";
import { HStack } from "@/shared/components/stack/HStack";
import { VStack } from "@/shared/components/stack/VStack";
import { Typo } from "@/shared/components/typo/Typo";
import { Image, Pressable, View } from "react-native";

interface PromptHeaderProps {
  prompt?: string;
}

export function PromptHeader({ prompt }: PromptHeaderProps) {
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

            <Typo.Display variant="display4" style={{ color: "#293038" }}>
              {prompt ||
                `"버텨줘서 고마워"라고 말해주고 싶은 나의 모습을 적어보세요`}
            </Typo.Display>
          </VStack>

          <Image
            source={require("@/assets/images/img_lody_prompt.png")}
            style={{ width: 63, height: 57 }}
            resizeMode="contain"
          />
        </HStack>

        <Pressable
          onPress={() => alert("Button Pressed")}
          style={{
            alignSelf: "stretch",
          }}
        >
          <View
            style={{
              height: 36,
              borderRadius: 7,
              justifyContent: "center",
              alignItems: "center",
              alignSelf: "stretch",
              backgroundColor: "#1C9D5F",
            }}
          >
            <Typo.Body
              variant="body5"
              style={{ color: "#FFFFFF", textAlign: "center" }}
            >
              오늘 일기쓰기
            </Typo.Body>
          </View>
        </Pressable>
      </VStack>
    </VStack>
  );
}
