import { Icon } from "@/shared/components/Icon";
import { HStack } from "@/shared/components/stack/HStack";
import { VStack } from "@/shared/components/stack/VStack";
import { Typo } from "@/shared/components/typo/Typo";
import { Image, Pressable, FlatList, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ListScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ScrollView>
          {/* Prompt Card */}
          <VStack
            style={{
              padding: 16,
              gap: 10,
              backgroundColor: "#F8F9FA",
              borderWidth: 1,
              borderColor: "#F2F2F2",
              borderRadius: 8,
              alignSelf: "stretch",
            }}
          >
            <VStack style={{ gap: 12, alignSelf: "stretch" }}>
              {/* 상단: 텍스트 + 캐릭터 이미지 */}
              <HStack
                alignment={10}
                style={{
                  paddingRight: 12,
                  gap: 12,
                  alignSelf: "stretch",
                }}
              >
                <VStack style={{ gap: 4, flex: 1 }}>
                  {/* 오늘의 감사 추천 라벨 */}
                  <HStack alignment={4} style={{ gap: 4 }}>
                    <Icon.IcStars width={18} height={18} />
                    <Typo.Body
                      variant="body5"
                      style={{ color: "#13B567" }}
                    >
                      오늘의 감사 추천
                    </Typo.Body>
                  </HStack>

                  {/* 메인 텍스트 */}
                  <Typo.Display
                    variant="display4"
                    style={{ color: "#293038" }}
                  >
                    {`"버텨줘서 고마워"라고 말해주고 싶은 나의 모습을 적어보세요`}
                  </Typo.Display>
                </VStack>

                {/* 로디 캐릭터 이미지 */}
                <Image
                  source={require("@/assets/images/img_lody_prompt.png")}
                  style={{ width: 63, height: 57 }}
                  resizeMode="contain"
                />
              </HStack>

              {/* 오늘 일기쓰기 버튼 */}
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

          <FlatList
            data={[]}
            renderItem={() => (
              <View>
                <Text>Item</Text>
              </View>
            )}
          />
        </ScrollView>
        <Text style={{ fontSize: 16, color: "#333" }}>모아보기</Text>
      </View>
    </SafeAreaView>
  );
}
