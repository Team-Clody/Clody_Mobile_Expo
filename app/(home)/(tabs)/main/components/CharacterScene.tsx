import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import ChevronDarkIcon from "@/assets/icons/Vector_bk.svg";
import GroupCharacter from "@/assets/images/Group.svg";
import {
  BG_CENTER_TRANSLATE_Y,
  BG_DEFAULT_ASPECT_RATIO,
  bgDefaultPng,
} from "../constants";
import { fontPreset } from "@/shared/theme/localeTypography";

type CharacterSceneProps = {
  characterTop: number;
  isKo: boolean;
  currentLevel: number;
  effectiveTotalCloverCount: number;
  cloversPerLevel: number;
  currentLevelProgress: number;
  levelChipTextStyle: object[];
  cloverCountTextStyle: object[];
  onOpenReward: () => void;
  onLayout: (width: number, height: number) => void;
};

export function CharacterScene({
  characterTop,
  isKo,
  currentLevel,
  effectiveTotalCloverCount,
  cloversPerLevel,
  currentLevelProgress,
  levelChipTextStyle,
  cloverCountTextStyle,
  onOpenReward,
  onLayout,
}: CharacterSceneProps) {
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
          <GroupCharacter
            width={128}
            height={183}
            style={{ marginBottom: 9 }}
            pointerEvents="none"
          />
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
              {effectiveTotalCloverCount} / {cloversPerLevel}{" "}
              <Text style={{ fontSize: 14, lineHeight: 16, includeFontPadding: false }}>
                {isKo
                  ? "클로버"
                  : currentLevelProgress === 1
                    ? "Clover"
                    : "Clovers"}
              </Text>
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
