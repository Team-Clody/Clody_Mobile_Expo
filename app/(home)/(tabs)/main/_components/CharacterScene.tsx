import i18n from "@/app/i18n/i18n";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import ChevronDarkIcon from "@/assets/icons/Vector_bk.svg";
import GroupCharacter from "@/assets/images/Group.svg";
import { Image as SkinImage } from "expo-image";
import type { GetEquippedSkinResponseDTO } from "@/api/dto/skin/response/getEquippedSkinResponseDTO";
import { getSkinCharacterSource, getHomeSkinImageStyle, HOME_CHARACTER_FRAME } from "@/shared/skins/skinAppearance";
import {
  BG_CENTER_TRANSLATE_Y,
  BG_DEFAULT_ASPECT_RATIO,
  bgDefaultPng,
} from "../_constants";

type CharacterSceneProps = {
  equippedSkin: GetEquippedSkinResponseDTO | null;
  characterTop: number;
  isKo: boolean;
  currentLevel: number;
  effectiveTotalCloverCount: number;
  cloverTarget: number;
  levelChipTextStyle: object[];
  cloverCountTextStyle: object[];
  onOpenReward: () => void;
  onLayout: (width: number, height: number) => void;
};

export function CharacterScene({
  equippedSkin,
  characterTop,
  isKo,
  currentLevel,
  effectiveTotalCloverCount,
  cloverTarget,
  levelChipTextStyle,
  cloverCountTextStyle,
  onOpenReward,
  onLayout,
}: CharacterSceneProps) {
  const skinSource = equippedSkin?.inventoryId != null
    ? getSkinCharacterSource(equippedSkin.skinCloverStage, equippedSkin.skinUrl)
    : null;
  return (
    <View
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
      }}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        onLayout(width, height);
      }}
    >
      <View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          justifyContent: "center",
          transform: [{ translateY: BG_CENTER_TRANSLATE_Y }],
        }}
      >
        <Image
          source={bgDefaultPng}
          resizeMode="cover"
          style={{ width: "100%", aspectRatio: BG_DEFAULT_ASPECT_RATIO }}
        />
      </View>
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          zIndex: 2,
          elevation: Platform.OS === "android" ? 6 : 0,
        }}
        pointerEvents="box-none"
      >
        <View
          style={{
            position: "absolute",
            top: characterTop,
            alignItems: "center",
          }}
        >
          <View style={{ ...HOME_CHARACTER_FRAME, marginBottom: 9, overflow: "visible" }} pointerEvents="none">
            {skinSource ? (
              <SkinImage
                source={skinSource}
                contentFit="contain"
                accessible
                accessibilityLabel={isKo ? "장착한 로디 스킨" : "Lody's equipped skin"}
                style={[{ position: "absolute" }, getHomeSkinImageStyle(equippedSkin?.skinCloverStage ?? null)]}
              />
            ) : (
              <GroupCharacter width={HOME_CHARACTER_FRAME.width} height={HOME_CHARACTER_FRAME.height} />
            )}
          </View>
          <Pressable
            onPress={onOpenReward}
            hitSlop={16}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(241, 245, 249, 0.46)",
              borderRadius: 999,
              paddingVertical: 5,
              paddingHorizontal: 7,
            }}
          >
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 3,
                marginRight: 6,
              }}
            >
              <Text
                style={[...levelChipTextStyle, { color: "#374151", fontSize: 14, padding: 2 }]}
              >
                {isKo ? `${currentLevel}단계` : `Lv.${currentLevel}`}
              </Text>
            </View>
            <Text
              style={[
                ...cloverCountTextStyle,
                {
                  color: "#1F2937",
                  fontSize: 16,
                  lineHeight: 16,
                  includeFontPadding: false,
                },
              ]}
            >
              {currentLevel === 21 && effectiveTotalCloverCount >= cloverTarget
                ? i18n.t("skin.maxLevel")
                : `${effectiveTotalCloverCount} / ${cloverTarget} ${isKo ? "클로버" : effectiveTotalCloverCount === 1 ? "Clover" : "Clovers"}`}
            </Text>
            <ChevronDarkIcon
              width={8}
              height={12}
              style={{ marginLeft: 9, transform: [{ translateY: 1 }] }}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
