import { useRouter } from "expo-router";
import IcLock from "@/assets/icons/ic_lock.svg";
import { useStorageStore } from "@/store/useStorageStore";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Tooltip from "./Tooltip";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } =
  Dimensions.get("window");
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

interface CostumeItem {
  level: number;
  name: string;
  requiredClovers: number;
}

const COSTUME_DATA: CostumeItem[] = [
  { level: 1, name: "멜빵 바지", requiredClovers: 2 },
  { level: 2, name: "핑크 드레스", requiredClovers: 4 },
  { level: 3, name: "악마 코스튬", requiredClovers: 10 },
  { level: 4, name: "마녀 원피스", requiredClovers: 15 },
  { level: 5, name: "산타 유니폼", requiredClovers: 20 },
  { level: 6, name: "탐정 코트", requiredClovers: 25 },
  { level: 7, name: "해적 의상", requiredClovers: 30 },
  { level: 8, name: "우비", requiredClovers: 40 },
  { level: 9, name: "기모노", requiredClovers: 50 },
  { level: 10, name: "턱시도", requiredClovers: 60 },
  { level: 11, name: "파자마", requiredClovers: 70 },
  { level: 12, name: "운동복", requiredClovers: 80 },
  { level: 13, name: "요리사 복", requiredClovers: 90 },
  { level: 14, name: "경찰 제복", requiredClovers: 100 },
  { level: 15, name: "소방관 복", requiredClovers: 120 },
  { level: 16, name: "왕자 의상", requiredClovers: 150 },
  { level: 17, name: "메이드복", requiredClovers: 180 },
  { level: 18, name: "락스타 자켓", requiredClovers: 200 },
  { level: 19, name: "한복", requiredClovers: 210 },
  { level: 20, name: "우주복", requiredClovers: 220 },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  totalClovers: number;
}

function getTooltipMessage(
  collectedInLevel: number,
  neededInLevel: number,
): string | null {
  if (neededInLevel <= 0) return null;
  if (collectedInLevel >= neededInLevel) return null;
  const remaining = neededInLevel - collectedInLevel;
  if (remaining === 1) return "거의 다 왔어요!";
  if (collectedInLevel / neededInLevel >= 0.7) return "조금만 더 힘내요";
  if (collectedInLevel === 0) return "시작이 좋아요";
  return null;
}

function getProgressInfo(
  totalClovers: number,
  claimedLevels: Set<number>,
): {
  currentLevel: number;
  collectedInLevel: number;
  neededInLevel: number;
  progress: number;
} {
  let previousRequired = 0;
  for (const item of COSTUME_DATA) {
    if (totalClovers < item.requiredClovers) {
      const range = item.requiredClovers - previousRequired;
      const collected = Math.max(
        0,
        Math.min(range, totalClovers - previousRequired),
      );
      return {
        currentLevel: item.level,
        collectedInLevel: collected,
        neededInLevel: range,
        progress: range > 0 ? collected / range : 0,
      };
    }
    previousRequired = item.requiredClovers;
  }
  return {
    currentLevel: COSTUME_DATA.length + 1,
    collectedInLevel: 0,
    neededInLevel: 0,
    progress: 1,
  };
}

export default function CloverRewardBottomSheet({
  visible,
  onClose,
  totalClovers,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [showModal, setShowModal] = useState(false);
  const claimedLevelsArr = useStorageStore(
    (s: { claimedLevels: number[] }) => s.claimedLevels,
  );
  const claimToStore = useStorageStore(
    (s: { claim: (level: number) => void }) => s.claim,
  );
  const claimedLevels = new Set<number>(claimedLevelsArr);
  const [acquiredItem, setAcquiredItem] = useState<CostumeItem | null>(null);

  const { currentLevel, collectedInLevel, neededInLevel, progress } =
    getProgressInfo(totalClovers, claimedLevels);
  const tooltipMessage = getTooltipMessage(collectedInLevel, neededInLevel);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
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
  }, [visible]);

  useEffect(() => {
    if (visible && scrollViewRef.current && currentLevel > 1) {
      const itemHeight = 80;
      const scrollTo = (currentLevel - 2) * itemHeight;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollTo, animated: true });
      }, 400);
    }
  }, [visible, currentLevel]);

  if (!showModal) return null;

  const handleClose = () => onClose();

  const handleClaim = (item: CostumeItem) => {
    claimToStore(item.level);
    setAcquiredItem(item);
  };

  const handleOpenStorage = () => {
    onClose();
    router.push("/(home)/storage");
  };

  const renderCostumeItem = (item: CostumeItem) => {
    const isClaimed = claimedLevels.has(item.level);
    const isCurrent = item.level === currentLevel;
    const canClaim = !isClaimed && totalClovers >= item.requiredClovers;
    const isLocked = !isClaimed && !isCurrent && !canClaim;

    const itemRange = item.requiredClovers;
    const itemCollected = Math.min(itemRange, totalClovers);
    const itemProgress = itemRange > 0 ? itemCollected / itemRange : 0;
    const showProgressBar = isCurrent || canClaim;

    return (
      <View key={item.level} style={styles.costumeItemWrapper}>
        {isCurrent && tooltipMessage && progress < 1 && (
          <View style={styles.tooltipAbs} pointerEvents="none">
            <Tooltip visible message={tooltipMessage} />
          </View>
        )}
        <View
          style={[styles.costumeItem, isCurrent && styles.costumeItemCurrent]}
        >
        <View style={styles.costumeIcon}>
          <View style={styles.iconPlaceholder}>
            <Text style={[styles.iconEmoji, isLocked && { opacity: 0.4 }]}>
              👔
            </Text>
          </View>
        </View>

        <View style={styles.costumeInfo}>
          <Text
            style={[styles.levelText, isCurrent && styles.levelTextCurrent]}
          >
            {item.level}단계
          </Text>
          <Text
            style={[styles.costumeName, isLocked && styles.costumeNameLocked]}
          >
            {item.name}
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
              onPress={() => handleClaim(item)}
            >
              <Text style={styles.claimButtonText}>받기</Text>
            </Pressable>
          ) : isCurrent ? (
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>
                {itemCollected}/{itemRange}
              </Text>
            </View>
          ) : isClaimed ? (
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
          {COSTUME_DATA.length + 1}단계
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
            {COSTUME_DATA.map((item) => renderCostumeItem(item))}
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
                  <Text style={styles.dialogIcon}>👔</Text>
                </View>
                <Text style={styles.dialogTitle}>
                  {acquiredItem.name}를 받았어요!
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
    marginTop:26,
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
