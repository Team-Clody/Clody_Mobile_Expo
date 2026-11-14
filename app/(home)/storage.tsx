import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image as SkinImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useStorageStore } from "@/store/useStorageStore";
import i18n from "@/app/i18n/i18n";
import IcBack from "@/assets/icons/ic_back.svg";
import IcFarmer from "@/assets/icons/ic_farmer.svg";
import IcPrincess from "@/assets/icons/ic_princess.svg";
import IcDevil from "@/assets/icons/ic_devil.svg";
import { saveWardrobeSelection } from "@/services/wardrobeService";
import { palette } from "@/shared/theme/palette";
import { typography } from "@/shared/theme/typography";
import { useWardrobe } from "@/shared/skins/useWardrobe";
import { getSkinCharacterSource } from "@/shared/skins/skinAppearance";

const COSTUME_ICONS: Record<
  number,
  { Icon: React.FC<{ width: number; height: number }>; width: number; height: number }
> = {
  1: { Icon: IcFarmer, width: 40, height: 40 },
  2: { Icon: IcPrincess, width: 40, height: 40 },
  3: { Icon: IcDevil, width: 50, height: 50 },
};

function getCostumeName(stage: number): string {
  const key = `skin.costumeName.${stage}` as const;
  const translated = i18n.t(key);
  if (translated !== key) return translated;
  return i18n.t("skin.level", { stage });
}

export default function StorageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setShouldReopenReward = useStorageStore(
    (s: { setShouldReopenReward: (value: boolean) => void }) =>
      s.setShouldReopenReward,
  );

  const { items: owned, equippedId: equippedInventoryId, selectedId: selectedInventoryId,
    setSelectedId: setSelectedInventoryId, loading, error, retry } = useWardrobe();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const savingRef = useRef(false);

  const selectedItem = useMemo(
    () => owned.find((o) => o.inventoryItemId === selectedInventoryId) ?? null,
    [owned, selectedInventoryId],
  );

  const isDirty = selectedInventoryId !== equippedInventoryId;
  const canSave = isDirty && (selectedInventoryId === null || selectedItem !== null) && !loading && !saving;
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
    if (!canSave || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      await saveWardrobeSelection(selectedInventoryId);
      router.replace("/(home)/(tabs)/main");
    } catch {
      setSaveError(true);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <View style={styles.safe}>
      <View style={[styles.scene, { height: Math.max(260, 339 - insets.top) }]}>
        <Image
          source={require("@/assets/images/bg_default.png")}
          style={[styles.background, { top: -14 - insets.top }]}
          resizeMode="cover"
        />
        <View style={styles.header}>
          <Pressable onPress={goBackToReward} hitSlop={12} accessibilityRole="button" accessibilityLabel={i18n.t("diaryWrite.back")}>
            <IcBack width={28} height={28} />
          </Pressable>
        </View>
        <SkinImage
          source={selectedItem
            ? getSkinCharacterSource(selectedItem.stage, selectedItem.url) ?? require("@/assets/images/lody_default.png")
            : require("@/assets/images/lody_default.png")}
          style={[styles.character, { top: 91 - insets.top }]}
          contentFit="contain"
        />
      </View>

      <View style={styles.itemsArea}>
        {loading && isEmpty ? (
          <View style={styles.emptyWrap}><ActivityIndicator accessibilityLabel={i18n.t("storage.loading")} /></View>
        ) : isEmpty && !error ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{i18n.t("storage.empty")}</Text>
          </View>
        ) : !isEmpty ? (
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
                  disabled={loading || saving}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={getCostumeName(item.stage)}
                >
                  <View style={styles.itemIcon}>
                    {COSTUME_ICONS[item.stage] ? (
                      (() => {
                        const { Icon, width, height } =
                          COSTUME_ICONS[item.stage];
                        return <Icon width={width} height={height} />;
                      })()
                    ) : item.url ? (
                      <SkinImage
                        source={{ uri: item.url }}
                        style={{ width: 40, height: 40 }}
                        contentFit="contain"
                      />
                    ) : (
                      <Text style={styles.itemEmoji}>👔</Text>
                    )}
                  </View>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {getCostumeName(item.stage)}
                  </Text>
                </Pressable>
              );
            }}
          />
        ) : null}
        {error && !loading && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{i18n.t("storage.loadError")}</Text>
            <Pressable onPress={retry} accessibilityRole="button" style={{ padding: 16 }}>
              <Text>{i18n.t("storage.retry")}</Text>
            </Pressable>
          </View>
        )}
        {saveError && <Text accessibilityRole="alert" style={styles.emptyText}>{i18n.t("storage.saveError")}</Text>}
      </View>

      <LinearGradient
        colors={[
          "rgba(255,255,255,0)",
          "#FFFFFF",
          "#FFFFFF",
        ]}
        locations={[0, 0.0819, 1]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
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
            {i18n.t("storage.save")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.gray30 },
  scene: { overflow: "hidden", backgroundColor: palette.gray30 },
  background: { position: "absolute", width: "100%", height: 404 },
  header: { height: 32, marginTop: 4, paddingHorizontal: 12, justifyContent: "center", zIndex: 1 },
  character: { position: "absolute", width: 200, height: 210, alignSelf: "center" },
  itemsArea: {
    flex: 1,
    backgroundColor: palette.gray0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    ...typography.body4,
    color: palette.gray600,
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
    backgroundColor: palette.gray800,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: palette.gray100,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  saveButtonTextDisabled: {
    color: palette.gray300,
  },
});
