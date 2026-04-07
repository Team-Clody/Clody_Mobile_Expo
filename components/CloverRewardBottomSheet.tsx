import { useRouter } from "expo-router";
import IcLock from "@/assets/icons/ic_lock.svg";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Tooltip from "./Tooltip";
import { SkinAPI } from "@/api/skinAPI";
import {
  GetSkinStatusListResponseDTO,
  SkinStatusItemResponseDTO,
} from "@/api/dto/skin/response/getSkinStatusListResponseDTO";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } =
  Dimensions.get("window");
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

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

interface Props {
  visible: boolean;
  onClose: () => void;
}

function getStageNumber(skin: SkinStatusItemResponseDTO): number {
  const raw = String(skin.cloverStage ?? "");
  const match = raw.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function getTooltipMessage(
  collected: number,
  needed: number,
): string | null {
  if (needed <= 0) return null;
  if (collected >= needed) return null;
  const remaining = needed - collected;
  if (remaining === 1) return "거의 다 왔어요!";
  if (collected / needed >= 0.7) return "조금만 더 힘내요";
  if (collected === 0) return "시작이 좋아요";
  return null;
}

export default function CloverRewardBottomSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState<GetSkinStatusListResponseDTO | null>(null);
  const [acquiredItem, setAcquiredItem] =
    useState<SkinStatusItemResponseDTO | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await SkinAPI.getSkinStatusList();
      console.log("[skins]", JSON.stringify(res, null, 2));
      setData(res);
    } catch (e) {
      console.log("스킨 목록 조회 실패", e);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      fetchData();
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 150,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: BOTTOM_SHEET_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setShowModal(false));
    }
  }, [visible, fetchData]);

  const totalClovers = data?.totalCloverCount ?? 0;
  const currentStage = data?.currentStage ?? 0;
  const currentStageMax = data?.currentStageMaxClover ?? 0;
  const skins = data?.skins ?? [];

  useEffect(() => {
    if (visible && scrollViewRef.current && currentStage > 1) {
      const itemHeight = 80;
      const scrollTo = (currentStage - 2) * itemHeight;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollTo, animated: true });
      }, 400);
    }
  }, [visible, currentStage]);

  if (!showModal) return null;

  const handleClose = () => onClose();

  const handleClaim = async (skin: SkinStatusItemResponseDTO) => {
    try {
      await SkinAPI.acquireSkin(skin.skinId);
      setAcquiredItem(skin);
      await fetchData();
    } catch (e) {
      console.log("스킨 받기 실패", e);
    }
  };

  const handleOpenStorage = () => {
    onClose();
    router.push("/(home)/storage");
  };

  const tooltipMessage = getTooltipMessage(totalClovers, currentStageMax);

  const renderCostumeItem = (skin: SkinStatusItemResponseDTO) => {
    const stageNum = getStageNumber(skin);
    const name = COSTUME_NAMES[stageNum] ?? `${stageNum}단계`;
    const isReceived = skin.status === "RECEIVED";
    const canClaim = skin.status === "UNLOCKED";
    const isLocked = skin.status === "LOCKED";
    const isCurrent = stageNum === currentStage && !isReceived;
    const showProgressBar = isCurrent || canClaim;
    const itemProgress = canClaim
      ? 1
      : isCurrent && currentStageMax > 0
        ? Math.min(1, totalClovers / currentStageMax)
        : 0;

    return (
      <View key={skin.skinId} style={styles.costumeItemWrapper}>
        {isCurrent && tooltipMessage && (
          <View style={styles.tooltipAbs} pointerEvents="none">
            <Tooltip visible message={tooltipMessage} />
          </View>
        )}
        <View
          style={[styles.costumeItem, isCurrent && styles.costumeItemCurrent]}
        >
          <View style={styles.costumeIcon}>
            <View style={styles.iconPlaceholder}>
              {skin.url ? (
                <Image
                  source={{ uri: skin.url }}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                  onError={(e) =>
                    console.log(
                      "[img error]",
                      skin.url,
                      e.nativeEvent?.error,
                    )
                  }
                />
              ) : (
                <Text style={[styles.iconEmoji, isLocked && { opacity: 0.4 }]}>
                  👔
                </Text>
              )}
            </View>
          </View>

          <View style={styles.costumeInfo}>
            <Text
              style={[styles.levelText, isCurrent && styles.levelTextCurrent]}
            >
              {stageNum}단계
            </Text>
            <Text
              style={[styles.costumeName, isLocked && styles.costumeNameLocked]}
            >
              {name}
            </Text>

            {showProgressBar && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(itemProgress * 100, 100)}%` },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.costumeRight}>
            {canClaim ? (
              <Pressable
                style={styles.claimButton}
                onPress={() => handleClaim(skin)}
              >
                <Text style={styles.claimButtonText}>받기</Text>
              </Pressable>
            ) : isCurrent ? (
              <View style={styles.progressBadge}>
                <Text style={styles.progressBadgeText}>
                  {totalClovers}/{currentStageMax}
                </Text>
              </View>
            ) : isReceived ? (
              <Text style={styles.acquiredText}>획득 완료</Text>
            ) : (
              <IcLock width={20} height={20} />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderComingSoon = () => (
    <View style={[styles.costumeItem, styles.costumeItemComingSoon]}>
      <View style={styles.costumeIcon}>
        <View
          style={[styles.iconPlaceholder, styles.iconPlaceholderComingSoon]}
        >
          <Text style={styles.questionMark}>?</Text>
        </View>
      </View>
      <View style={styles.costumeInfo}>
        <Text style={[styles.levelText, { color: "#C4C4C4" }]}>
          {skins.length + 1}단계
        </Text>
        <Text style={[styles.costumeName, { color: "#C4C4C4" }]}>
          Coming Soon
        </Text>
      </View>
    </View>
  );

  return (
    <Modal transparent visible={showModal} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[styles.bottomSheet, { transform: [{ translateY }] }]}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>클로버 획득 보상</Text>
            <Text style={styles.subtitle}>
              감사일기 작성하고, 로디 옷을 받아보세요.
            </Text>

            <View style={styles.cloverCountCard}>
              <Text style={styles.cloverLabel}>내 클로버</Text>
              <Text style={styles.cloverCount}>{totalClovers}개</Text>
            </View>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {skins.map((skin) => renderCostumeItem(skin))}
            {renderComingSoon()}
          </ScrollView>

          <View
            style={[
              styles.bottomButtons,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <Pressable
              style={styles.storageButton}
              onPress={handleOpenStorage}
            >
              <Text style={styles.storageButtonText}>보관함</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={handleClose}>
              <Text style={styles.confirmButtonText}>확인</Text>
            </Pressable>
          </View>
        </Animated.View>

        {acquiredItem && (
          <Modal transparent visible animationType="fade">
            <View style={styles.dialogOverlay}>
              <View style={styles.dialog}>
                <View style={styles.dialogIconWrap}>
                  {acquiredItem.url ? (
                    <Image
                      source={{ uri: acquiredItem.url }}
                      style={{ width: 56, height: 56 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.dialogIcon}>👔</Text>
                  )}
                </View>
                <Text style={styles.dialogTitle}>
                  {COSTUME_NAMES[getStageNumber(acquiredItem)] ??
                    `${getStageNumber(acquiredItem)}단계`}
                  를 받았어요!
                </Text>
                <Text style={styles.dialogSubtitle}>
                  보관함에서 확인할 수 있어요.
                </Text>
                <Pressable
                  style={styles.dialogButton}
                  onPress={() => setAcquiredItem(null)}
                >
                  <Text style={styles.dialogButtonText}>확인</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheet: {
    height: BOTTOM_SHEET_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D9D9D9",
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    marginTop: 26,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#8E8E8E",
    marginBottom: 22,
  },
  cloverCountCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#F4F6F8",
    borderRadius: 12,
  },
  cloverLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3C3C43",
  },
  cloverCount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  costumeItemWrapper: {
    position: "relative",
    marginBottom: 12,
    overflow: "visible",
  },
  tooltipAbs: {
    position: "absolute",
    top: -10,
    right: 32,
    transform: [{ translateX: "50%" }],
    zIndex: 1000,
    elevation: 1000,
  },
  costumeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 74,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 20,
    backgroundColor: "#F8F9FC",
    borderRadius: 11,
    overflow: "visible",
  },
  costumeItemCurrent: {
    paddingRight: 12,
    backgroundColor: "#F2FEEE",
    borderWidth: 1,
    borderColor: "#8FF76F",
  },
  costumeItemComingSoon: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#E3E6ED",
    paddingRight: 12,
    opacity: 1,
  },
  costumeIcon: {
    marginRight: 12,
  },
  iconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  iconPlaceholderComingSoon: {
    width: 50,
    height: 50,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 7,
    backgroundColor: "#F8F9FC",
    justifyContent: "center",
    alignItems: "center",
  },
  iconEmoji: {
    fontSize: 24,
  },
  questionMark: {
    fontSize: 24,
    color: "#C4C4C4",
    fontWeight: "700",
  },
  costumeInfo: {
    flex: 1,
  },
  levelText: {
    fontSize: 12,
    color: "#8E8E8E",
    marginBottom: 2,
  },
  levelTextCurrent: {
    color: "#5EB362",
    fontWeight: "600",
  },
  costumeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
  costumeNameLocked: {
    color: "#111111",
  },
  progressContainer: {
    marginTop: 6,
    width: (165 / 375) * SCREEN_WIDTH,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E8E8E8",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00D15A",
    borderRadius: 2,
  },
  costumeRight: {
    marginLeft: 8,
    alignItems: "flex-end",
  },
  progressBadge: {
    backgroundColor: "#00D15A",
    height: 28,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  claimButton: {
    alignSelf: "flex-end",
    marginRight: -8,
    backgroundColor: "#00D15A",
    height: 28,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  claimButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  acquiredText: {
    fontSize: 13,
    color: "#8E8E8E",
    fontWeight: "500",
  },
  bottomButtons: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 34,
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  storageButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  storageButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#282A31",
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dialogOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  dialogIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#F4F6F8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  dialogIcon: {
    fontSize: 40,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 6,
  },
  dialogSubtitle: {
    fontSize: 13,
    color: "#8E8E8E",
    marginBottom: 18,
  },
  dialogButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  dialogButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
});
