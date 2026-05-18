import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useStorageStore } from "@/store/useStorageStore";
import IcBack from "@/assets/icons/ic_back.svg";
import IcFarmer from "@/assets/icons/ic_farmer.svg";
import IcPrincess from "@/assets/icons/ic_princess.svg";
import IcDevil from "@/assets/icons/ic_devil.svg";

const COSTUME_ICONS: Record<
  number,
  { Icon: React.FC<{ width: number; height: number }>; width: number; height: number }
> = {
  1: { Icon: IcFarmer, width: 40, height: 40 },
  2: { Icon: IcPrincess, width: 40, height: 40 },
  3: { Icon: IcDevil, width: 50, height: 50 },
};
import { SkinAPI } from "@/api/skinAPI";
import { InventoryAPI } from "@/api/inventoryAPI";
import { SkinStatusItemResponseDTO } from "@/api/dto/skin/response/getSkinStatusListResponseDTO";
import { UserInventoryItemResponseDTO } from "@/api/dto/inventory/response/getUserInventoryListResponseDTO";

const COSTUME_LODY: Record<number, any> = {
  1: require("@/assets/images/farmer.png"),
  2: require("@/assets/images/princess.png"),
  3: require("@/assets/images/devil.png"),
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

interface OwnedSkin {
  inventoryItemId: number;
  skinId: number;
  stage: number;
  url: string;
  name: string;
  isEquipped: boolean;
}

export default function StorageScreen() {
  const router = useRouter();
  const setShouldReopenReward = useStorageStore(
    (s: { setShouldReopenReward: (value: boolean) => void }) =>
      s.setShouldReopenReward,
  );

  const [owned, setOwned] = useState<OwnedSkin[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(
    null,
  );
  const [equippedInventoryId, setEquippedInventoryId] = useState<number | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    try {
      const [skinList, invList] = await Promise.all([
        SkinAPI.getSkinStatusList(),
        InventoryAPI.getUserInventories(),
      ]);

      const parseStage = (s: string) => {
        const m = String(s ?? "").match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      };
      const receivedSkins: SkinStatusItemResponseDTO[] = skinList.skins
        .filter((s) => s.status === "RECEIVED")
        .sort((a, b) => parseStage(a.cloverStage) - parseStage(b.cloverStage));
      const inventories: UserInventoryItemResponseDTO[] = [
        ...invList.inventories,
      ].sort(
        (a, b) =>
          new Date(a.acquiredAt).getTime() - new Date(b.acquiredAt).getTime(),
      );

      const merged: OwnedSkin[] = receivedSkins.map((skin, idx) => {
        const inv = inventories[idx];
        const stageMatch = String(skin.cloverStage ?? "").match(/\d+/);
        const stage = stageMatch ? parseInt(stageMatch[0], 10) : 0;
        return {
          inventoryItemId: inv?.inventoryItemId ?? -1,
          skinId: skin.skinId,
          stage,
          url: skin.url,
          name: COSTUME_NAMES[stage] ?? `${stage}단계`,
          isEquipped: inv?.isEquipped ?? false,
        };
      });

      const equipped = merged.find((m) => m.isEquipped);
      setOwned(merged);
      setEquippedInventoryId(equipped?.inventoryItemId ?? null);
      setSelectedInventoryId(equipped?.inventoryItemId ?? null);
    } catch (e) {
      console.log("보관함 조회 실패", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedItem = useMemo(
    () => owned.find((o) => o.inventoryItemId === selectedInventoryId) ?? null,
    [owned, selectedInventoryId],
  );

  const isDirty = selectedInventoryId !== equippedInventoryId;
  const canSave = isDirty && selectedInventoryId !== null;
  const isEmpty = owned.length === 0;

  const handleSelect = (inventoryItemId: number) => {
    setSelectedInventoryId((prev) =>
      prev === inventoryItemId ? null : inventoryItemId,
    );
  };

  const goBackToReward = () => {
    setShouldReopenReward(true);
    router.back();
  };

  const handleSave = async () => {
    if (!canSave || selectedInventoryId == null) return;
    try {
      await SkinAPI.equipSkin(selectedInventoryId);
      router.replace("/(home)/(tabs)/main");
    } catch (e) {
      console.log("스킨 장착 실패", e);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar backgroundColor="#F8F9FC" barStyle="dark-content" />
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
            selectedItem && COSTUME_LODY[selectedItem.stage]
              ? COSTUME_LODY[selectedItem.stage]
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
            data={owned}
            keyExtractor={(item) => String(item.inventoryItemId)}
            numColumns={3}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => {
              const isSelected = selectedInventoryId === item.inventoryItemId;
              return (
                <Pressable
                  style={[
                    styles.itemCard,
                    isSelected && styles.itemCardSelected,
                  ]}
                  onPress={() => handleSelect(item.inventoryItemId)}
                >
                  <View style={styles.itemIcon}>
                    {COSTUME_ICONS[item.stage] ? (
                      (() => {
                        const { Icon, width, height } =
                          COSTUME_ICONS[item.stage];
                        return <Icon width={width} height={height} />;
                      })()
                    ) : item.url ? (
                      <Image
                        source={{ uri: item.url }}
                        style={{ width: 40, height: 40 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.itemEmoji}>👔</Text>
                    )}
                  </View>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      {!isEmpty && (
        <>
          <LinearGradient
            colors={["rgba(255,255,255,0)", "#FFFFFF", "#FFFFFF"]}
            locations={[0, 0.0819, 1]}
            style={styles.bottomGradient}
            pointerEvents="none"
          />
          <View style={styles.bottomBar}>
            <Pressable
              style={[
                styles.saveButton,
                !canSave && styles.saveButtonDisabled,
              ]}
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
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8F9FC",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  characterArea: {
    height: 320,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  character: {
    width: 200,
    height: 210,
  },
  itemsArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
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
    borderColor: "#293038",
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
    color: "#4A4C54",
    fontWeight: "600",
    letterSpacing: -0.26,
  },
  bottomGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 76,
    height: 40,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  saveButton: {
    height: 48,
    borderRadius: 6,
    backgroundColor: "#293038",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#F2F3F6",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.32,
  },
  saveButtonTextDisabled: {
    color: "#ABAFBB",
  },
});
