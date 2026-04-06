import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStorageStore } from "@/store/useStorageStore";
import IcFarmer from "@/assets/icons/ic_farmer.svg";
import IcBack from "@/assets/icons/ic_back.svg";

const COSTUME_ICONS: Record<number, React.FC<{ width: number; height: number }>> = {
  1: IcFarmer,
};

const COSTUME_LODY: Record<number, any> = {
  1: require("@/assets/images/farmer.png"),
};

const COSTUME_NAMES: Record<number, string> = {
  1: "멜빵 바지",
  2: "핑크 드레스",
  3: "악마 코스튬",
  4: "마녀 원피스",
  5: "산타 유니폼",
  6: "탐정 코트",
  7: "해적 의상",
  8: "우비",
  9: "기모노",
  10: "턱시도",
  11: "파자마",
  12: "운동복",
  13: "요리사 복",
  14: "경찰 제복",
  15: "소방관 복",
  16: "왕자 의상",
  17: "메이드복",
  18: "락스타 자켓",
  19: "한복",
  20: "우주복",
};

export default function StorageScreen() {
  const router = useRouter();
  const claimedLevels = useStorageStore(
    (s: { claimedLevels: number[] }) => s.claimedLevels,
  );
  const equippedLevel = useStorageStore(
    (s: { equippedLevel: number | null }) => s.equippedLevel,
  );
  const setEquipped = useStorageStore(
    (s: { setEquipped: (level: number | null) => void }) => s.setEquipped,
  );
  const setShouldReopenReward = useStorageStore(
    (s: { setShouldReopenReward: (value: boolean) => void }) =>
      s.setShouldReopenReward,
  );

  const [selected, setSelected] = useState<number | null>(equippedLevel);

  const items = useMemo(
    () => [...claimedLevels].sort((a, b) => a - b),
    [claimedLevels],
  );

  const isDirty = selected !== equippedLevel;
  const canSave = isDirty;
  const isEmpty = items.length === 0;

  const handleSelect = (level: number) => {
    setSelected((prev) => (prev === level ? null : level));
  };

  const goBackToReward = () => {
    setShouldReopenReward(true);
    router.back();
  };

  const handleSave = () => {
    if (!canSave) return;
    setEquipped(selected);
    router.replace("/(home)/(tabs)/main");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={goBackToReward} hitSlop={12}>
          <IcBack width={24} height={24} />
        </Pressable>
      </View>

      <ImageBackground
        source={require("@/assets/images/bg_default.png")}
        style={styles.characterArea}
        resizeMode="cover"
      >
        <Image
          source={
            selected !== null && COSTUME_LODY[selected]
              ? COSTUME_LODY[selected]
              : require("@/assets/images/lody_default.png")
          }
          style={styles.character}
          resizeMode="contain"
        />
      </ImageBackground>

      <View style={styles.itemsArea}>
        {isEmpty ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>아직 받은 옷이 없어요.</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(level) => String(level)}
            numColumns={3}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item: level }) => {
              const isSelected = selected === level;
              return (
                <Pressable
                  style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                  onPress={() => handleSelect(level)}
                >
                  <View style={styles.itemIcon}>
                    {COSTUME_ICONS[level] ? (
                      (() => {
                        const Icon = COSTUME_ICONS[level];
                        return <Icon width={36} height={36} />;
                      })()
                    ) : (
                      <Text style={styles.itemEmoji}>👔</Text>
                    )}
                  </View>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {COSTUME_NAMES[level] ?? `${level}단계`}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text
            style={[
              styles.saveButtonText,
              !canSave && styles.saveButtonTextDisabled,
            ]}
          >
            저장하기
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  back: {
    fontSize: 22,
    color: "#111111",
  },
  characterArea: {
    height: 360,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  character: {
    width: 200,
    height: 240,
    marginBottom: 40,
  },
  itemsArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9A9A9A",
  },
  gridContent: {
    paddingBottom: 16,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  itemCard: {
    width: 104,
    height: 104,
    paddingHorizontal: 8,
    paddingVertical: 16,
    backgroundColor: "#F8F9FC",
    borderRadius: 10,
    borderWidth: 2.1,
    borderColor: "transparent",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemCardSelected: {
    borderColor: "#4A4C54",
  },
  itemIcon: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  itemEmoji: {
    fontSize: 28,
  },
  itemName: {
    fontSize: 13,
    color: "#111111",
    fontWeight: "500",
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  saveButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#282A31",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#F0F0F0",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  saveButtonTextDisabled: {
    color: "#9A9A9A",
  },
});
