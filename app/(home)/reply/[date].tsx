import { DiaryAPI, type GetDiaryResponseDTO } from "@/api/diaryAPI";
import type { GetReplyResponseDTO } from "@/api/dto/reply/response/getReplyResponseDTO";
import {
  ReplyAPI,
  getSupportedReplyLanguage,
  type ReplyAdRequest,
} from "@/api/replyAPI";
import i18n from "@/app/i18n/i18n";
import BackIcon from "@/assets/icons/ic_back.svg";
import ChevronIcon from "@/assets/icons/ic_chevron_green.svg";
import LodyHead from "@/assets/images/lody_head.svg";
import { useAdMobRewarded } from "@/shared/ads";
import { Toast } from "@/shared/components/Toast";
import { palette } from "@/shared/theme/palette";
import { typography } from "@/shared/theme/typography";
import { diaryCreatedToReplyReadyMs } from "@/shared/utils/diaryReplyTimer";
import { isAxiosError } from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ReplyPhase = "waiting" | "ready" | "opened";

const REPLY_HEADER_AND_TABS_HEIGHT = 83;
const REPLY_STATUS_CONTENT_HEIGHT = 243;

const pad = (value: number) => String(value).padStart(2, "0");

function parseDate(date?: string) {
  const values = date?.split("-").map(Number) ?? [];
  if (values.length !== 3 || values.some((value) => !Number.isInteger(value))) {
    return null;
  }
  const [year, month, day] = values;
  return { year, month, day };
}

function formatDate(date?: string) {
  const parsed = parseDate(date);
  if (!parsed) return i18n.t("reply.titleFallback");
  return new Date(parsed.year, parsed.month - 1, parsed.day).toLocaleDateString(
    i18n.locale?.startsWith("ko") ? "ko-KR" : "en-US",
    { month: "long", day: "numeric" },
  );
}

function ReplyHeader({
  title,
  activeTab,
  onBack,
  onChangeTab,
}: {
  title: string;
  activeTab: "diary" | "reply";
  onBack: () => void;
  onChangeTab: (tab: "diary" | "reply") => void;
}) {
  const tabs: { key: "diary" | "reply"; label: string }[] = [
    { key: "diary", label: i18n.t("reply.tabs.diary") },
    { key: "reply", label: i18n.t("reply.tabs.reply") },
  ];

  return (
    <>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={i18n.t("reply.back")} hitSlop={8} onPress={onBack}>
          <BackIcon width={28} height={28} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSide} />
      </View>
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => onChangeTab(tab.key)}
              style={styles.tab}
            >
              <Text style={isActive ? styles.activeTabText : styles.inactiveTab}>{tab.label}</Text>
              <View style={[styles.tabIndicator, isActive && styles.activeTabIndicator]} />
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function MyDiary({ diary }: { diary: GetDiaryResponseDTO | null }) {
  const entries = diary?.diaries ?? [];
  return (
    <ScrollView contentContainerStyle={styles.diaryList} showsVerticalScrollIndicator={false}>
      {entries.map((entry, index) => (
        <View key={`${index}-${entry.content}`} style={styles.diaryItem}>
          <Text style={styles.diaryText}>{`${index + 1}. ${entry.content}`}</Text>
          <Text accessibilityLabel={i18n.t("reply.diaryMore")} style={styles.moreIcon}>⋮</Text>
        </View>
      ))}
      {entries.length === 0 && <Text style={styles.emptyDiary}>{i18n.t("reply.emptyDiary")}</Text>}
    </ScrollView>
  );
}

function useCenteredReplyContentTop() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return Math.max(
    0,
    height / 2
      - insets.top
      - REPLY_HEADER_AND_TABS_HEIGHT
      - REPLY_STATUS_CONTENT_HEIGHT / 2,
  );
}

function WaitingReply({
  remaining,
  adDisabled,
  onPressAd,
}: {
  remaining: number;
  adDisabled?: boolean;
  onPressAd: () => void;
}) {
  const contentTop = useCenteredReplyContentTop();
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor(remaining / 60_000) % 60;
  const seconds = Math.floor(remaining / 1_000) % 60;
  return (
    <View style={[styles.waitingContent, { paddingTop: contentTop }]}>
      <View style={[styles.imagePlaceholder, styles.waitingLody]} />
      <Text style={styles.waitingCaption}>{i18n.t("reply.waiting.caption")}</Text>
      <Text style={styles.timer}>{`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={adDisabled}
        onPress={onPressAd}
        style={[styles.adButton, adDisabled && styles.disabledButton]}
      >
        <Text style={styles.adButtonText}>{i18n.t("reply.waiting.ad")}</Text>
        <ChevronIcon width={16} height={16} color={palette.gray0} />
      </Pressable>
    </View>
  );
}

function ReadyReply({ onOpen }: { onOpen: () => void }) {
  const contentTop = useCenteredReplyContentTop();

  return (
    <View style={[styles.readyContent, { paddingTop: contentTop }]}>
      <View style={[styles.imagePlaceholder, styles.readyLody]} />
      <Text style={styles.readyCaption}>{i18n.t("reply.ready.caption")}</Text>
      <Text style={styles.readyTimer}>00:00:00</Text>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.openButton}>
        <Text style={styles.openButtonText}>{i18n.t("reply.ready.open")}</Text>
        <ChevronIcon width={16} height={16} color={palette.gray0} />
      </Pressable>
    </View>
  );
}

function ReplyLetter({ reply }: { reply: GetReplyResponseDTO }) {
  return (
    <View style={styles.letterWrap}>
      <View pointerEvents="none" style={styles.letterGlow} />
      <ScrollView contentContainerStyle={styles.letter} showsVerticalScrollIndicator={false}>
        <LodyHead style={styles.letterLody} />
        <Text style={styles.to}>{i18n.t("reply.letter.to", { nickname: reply.nickname })}</Text>
        <Text style={styles.letterContent}>{reply.content}</Text>
        <Text style={styles.from}>{i18n.t("reply.letter.from")}</Text>
      </ScrollView>
    </View>
  );
}

function CloverRewardModal({ visible, onConfirm }: { visible: boolean; onConfirm: () => void }) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onConfirm}>
      <View style={styles.modalOverlay}>
        <View style={styles.rewardModal}>
          <View style={[styles.imagePlaceholder, styles.cloverImage]} />
          <Text style={styles.rewardTitle}>{i18n.t("reply.reward.title")}</Text>
          <Text style={styles.rewardDescription}>{i18n.t("reply.reward.description")}</Text>
          <Pressable accessibilityRole="button" onPress={onConfirm} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>{i18n.t("reply.reward.confirm")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function ReplyScreen() {
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);
  const { date } = useLocalSearchParams<{ date: string }>();
  const targetDate = useMemo(() => parseDate(date), [date]);
  const supportedLanguage = getSupportedReplyLanguage();
  const fastReplyRewardAd = useAdMobRewarded("fastReplyReward");
  const pendingFastReplyRequestRef = useRef<ReplyAdRequest | null>(null);
  const queuedFastReplyRequestRef = useRef<ReplyAdRequest | null>(null);
  const [activeTab, setActiveTab] = useState<"diary" | "reply">("reply");
  const [diary, setDiary] = useState<GetDiaryResponseDTO | null>(null);
  const [reply, setReply] = useState<GetReplyResponseDTO | null>(null);
  const [replyReadyAt, setReplyReadyAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "warning";
  } | null>(null);
  const [isStartingFastReplyAd, setIsStartingFastReplyAd] = useState(false);
  const [isWaitingForFastReplyAdLoad, setIsWaitingForFastReplyAdLoad] =
    useState(false);

  const replyAdRequest = useMemo<ReplyAdRequest | null>(() => {
    if (!targetDate) return null;
    return {
      year: targetDate.year,
      month: targetDate.month,
      date: targetDate.day,
      supportedLanguage,
    };
  }, [targetDate, supportedLanguage]);

  const showReplyUnavailableError = useCallback(() => {
    console.error("[reply] 타이머 종료 후에도 답장이 준비되지 않음");
    setToast({
      message: i18n.t("reply.toast.genericError"),
      variant: "warning",
    });
  }, []);

  const loadReply = useCallback(async () => {
    if (!targetDate) return null;
    try {
      const result = await ReplyAPI.getReply(targetDate.year, targetDate.month, targetDate.day);
      setReply(result);
      return result;
    } catch {
      return null;
    }
  }, [targetDate]);

  useEffect(() => {
    if (!targetDate) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [diaryResult, timeResult] = await Promise.all([
          DiaryAPI.getDiary(targetDate.year, targetDate.month, targetDate.day),
          DiaryAPI.getDiaryCreatedTime(
            targetDate.year,
            targetDate.month,
            targetDate.day,
          ),
        ]);
        const readyAt = diaryCreatedToReplyReadyMs(timeResult);
        const replyResult = readyAt != null && readyAt <= Date.now()
          ? await ReplyAPI.getReply(
              targetDate.year,
              targetDate.month,
              targetDate.day,
            ).catch(() => null)
          : null;
        if (cancelled) return;
        setDiary(diaryResult);
        setReply(replyResult);
        setReplyReadyAt(readyAt);
      } catch (error) {
        console.warn("[reply] 화면 데이터 불러오기 실패", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetDate]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(intervalId);
  }, []);

  const revealReplyAfterAd = useCallback(async () => {
    const loadedReply = await loadReply();
    if (!loadedReply?.content?.trim()) {
      showReplyUnavailableError();
      return;
    }
    setReplyReadyAt(Date.now());
    setOpened(true);
    if (!loadedReply.isRead) setShowReward(true);
  }, [loadReply, showReplyUnavailableError]);

  useEffect(() => {
    const pendingRequest = pendingFastReplyRequestRef.current;
    if (!fastReplyRewardAd.isEarnedReward || !pendingRequest) return;

    pendingFastReplyRequestRef.current = null;
    ReplyAPI.endAdViewing(pendingRequest)
      .then(() => {
        void revealReplyAfterAd();
      })
      .catch((error) => {
        console.warn("[reply] fast reply ad end failed", error);
        setToast({
          message: i18n.t("ads.unavailable"),
          variant: "warning",
        });
      });
  }, [fastReplyRewardAd.isEarnedReward, revealReplyAfterAd]);

  useEffect(() => {
    if (!fastReplyRewardAd.isClosed || !pendingFastReplyRequestRef.current) return;
    if (fastReplyRewardAd.isEarnedReward) return;
    pendingFastReplyRequestRef.current = null;
  }, [fastReplyRewardAd.isClosed, fastReplyRewardAd.isEarnedReward]);

  useEffect(() => {
    if (!fastReplyRewardAd.error || !pendingFastReplyRequestRef.current) return;

    pendingFastReplyRequestRef.current = null;
    setToast({
      message: i18n.t("ads.unavailable"),
      variant: "warning",
    });
  }, [fastReplyRewardAd.error]);

  useEffect(() => {
    if (!fastReplyRewardAd.error || !queuedFastReplyRequestRef.current) return;

    queuedFastReplyRequestRef.current = null;
    setIsWaitingForFastReplyAdLoad(false);
    setToast({
      message: i18n.t("ads.unavailable"),
      variant: "warning",
    });
  }, [fastReplyRewardAd.error]);

  const remaining = Math.max(0, (replyReadyAt ?? now) - now);
  const hasReplyContent = Boolean(reply?.content?.trim());
  const isReplyReadyByTime = replyReadyAt != null && remaining === 0;

  useEffect(() => {
    if (!isReplyReadyByTime || hasReplyContent) return;
    void loadReply().then((loadedReply) => {
      if (!loadedReply?.content?.trim()) {
        console.error("[reply] 타이머 종료 후에도 답장이 준비되지 않음");
      }
    });
  }, [hasReplyContent, isReplyReadyByTime, loadReply]);

  const phase: ReplyPhase = !isReplyReadyByTime
    ? "waiting"
    : opened || (hasReplyContent && reply?.isRead)
      ? "opened"
      : "ready";
  const changeTab = (tab: "diary" | "reply") => {
    setActiveTab(tab);
    pagerRef.current?.setPage(tab === "diary" ? 0 : 1);
  };

  const openReply = async () => {
    const loadedReply = hasReplyContent ? reply : await loadReply();
    if (!loadedReply?.content?.trim()) {
      showReplyUnavailableError();
      return;
    }
    setOpened(true);
    if (!loadedReply.isRead) setShowReward(true);
  };

  const startFastReplyAdFlow = useCallback(async (request: ReplyAdRequest) => {
    if (fastReplyRewardAd.isShowing || isStartingFastReplyAd) {
      return;
    }
    setIsStartingFastReplyAd(true);
    try {
      await ReplyAPI.startAdViewing(request);
    } catch (error) {
      console.warn("[reply] fast reply ad start failed", {
        request,
        status: isAxiosError(error) ? error.response?.status : undefined,
        data: isAxiosError(error) ? error.response?.data : undefined,
        message: error instanceof Error ? error.message : String(error),
      });
      setToast({
        message: i18n.t("ads.unavailable"),
        variant: "warning",
      });
      return;
    } finally {
      setIsStartingFastReplyAd(false);
    }

    pendingFastReplyRequestRef.current = request;
    const didShowAd = fastReplyRewardAd.showAd();
    if (didShowAd) return;

    pendingFastReplyRequestRef.current = null;
    setToast({
      message: i18n.t(fastReplyRewardAd.error ? "ads.unavailable" : "ads.notReady"),
      variant: "warning",
    });
  }, [fastReplyRewardAd, isStartingFastReplyAd]);

  useEffect(() => {
    if (!isWaitingForFastReplyAdLoad || !fastReplyRewardAd.isLoaded) return;

    const queuedRequest = queuedFastReplyRequestRef.current;
    queuedFastReplyRequestRef.current = null;
    setIsWaitingForFastReplyAdLoad(false);

    if (!queuedRequest) return;
    void startFastReplyAdFlow(queuedRequest);
  }, [
    fastReplyRewardAd.isLoaded,
    isWaitingForFastReplyAdLoad,
    startFastReplyAdFlow,
  ]);

  useEffect(() => {
    if (!isWaitingForFastReplyAdLoad) return;

    const timeoutId = setTimeout(() => {
      if (!queuedFastReplyRequestRef.current) return;
      console.warn("[reply] fast reply ad load timeout", {
        unitId: fastReplyRewardAd.unitId,
      });
      queuedFastReplyRequestRef.current = null;
      setIsWaitingForFastReplyAdLoad(false);
      setToast({
        message: i18n.t("ads.notReady"),
        variant: "warning",
      });
    }, 15_000);

    return () => clearTimeout(timeoutId);
  }, [fastReplyRewardAd.unitId, isWaitingForFastReplyAdLoad]);

  const handlePressAd = async () => {
    if (
      !replyAdRequest ||
      fastReplyRewardAd.isShowing ||
      isStartingFastReplyAd ||
      isWaitingForFastReplyAdLoad
    ) {
      return;
    }

    if (!fastReplyRewardAd.isLoaded) {
      queuedFastReplyRequestRef.current = replyAdRequest;
      setIsWaitingForFastReplyAdLoad(true);
      console.log("[reply] fast reply ad loading", {
        unitId: fastReplyRewardAd.unitId,
      });
      fastReplyRewardAd.load();
      return;
    }

    await startFastReplyAdFlow(replyAdRequest);
  };

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator color={palette.accentPrimary500} /></View>;
  }

  return (
    <View style={styles.screen}>
      <ReplyHeader
        title={formatDate(date)}
        activeTab={activeTab}
        onBack={() => router.back()}
        onChangeTab={changeTab}
      />
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={1}
        onPageSelected={({ nativeEvent }) => setActiveTab(nativeEvent.position === 0 ? "diary" : "reply")}
      >
        <View key="diary" style={styles.page}>
          <MyDiary diary={diary} />
        </View>
        <View key="reply" style={styles.page}>
          {phase === "waiting" ? (
            <WaitingReply
              remaining={remaining}
              adDisabled={
                fastReplyRewardAd.isShowing ||
                isStartingFastReplyAd ||
                isWaitingForFastReplyAdLoad
              }
              onPressAd={handlePressAd}
            />
          ) : phase === "ready" ? (
            <ReadyReply onOpen={openReply} />
          ) : reply ? (
            <ReplyLetter reply={reply} />
          ) : null}
        </View>
      </PagerView>
      <CloverRewardModal visible={showReward} onConfirm={() => setShowReward(false)} />
      <Toast
        message={toast?.message ?? ""}
        visible={toast !== null}
        variant={toast?.variant}
        onHide={() => setToast(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.gray0 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.gray0 },
  header: { height: 32, marginTop: 4, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { ...typography.body1, color: palette.gray1000 },
  headerSide: { width: 28, height: 28 },
  tabs: { height: 31, marginTop: 16, paddingHorizontal: 20, flexDirection: "row", gap: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.gray100 },
  tab: { flex: 1, height: 31, alignItems: "center", justifyContent: "space-between" },
  tabIndicator: { width: "100%", height: 2, borderRadius: 1 },
  activeTabIndicator: { backgroundColor: palette.gray800 },
  inactiveTab: { ...typography.body2, color: palette.gray400 },
  activeTabText: { ...typography.body2, color: palette.gray800 },
  pager: { flex: 1 },
  page: { flex: 1 },
  diaryList: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, gap: 12 },
  diaryItem: { minHeight: 50, borderWidth: 1, borderColor: palette.gray100, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center" },
  diaryText: { ...typography.body4, color: palette.gray1000, flex: 1, lineHeight: 18 },
  moreIcon: { ...typography.body3, color: palette.gray400, width: 24, textAlign: "center" },
  emptyDiary: { ...typography.body3, color: palette.gray400, textAlign: "center", marginTop: 48 },
  imagePlaceholder: { backgroundColor: palette.gray200 },
  waitingContent: { flex: 1, alignItems: "center" },
  waitingLody: { width: 100, height: 100, marginBottom: 28 },
  waitingCaption: { ...typography.body9, color: palette.gray500 },
  timer: { ...typography.head1, color: "#282A31", marginTop: 4 },
  adButton: { height: 40, marginTop: 22, paddingLeft: 16, paddingRight: 10, borderRadius: 39, backgroundColor: palette.gray700, flexDirection: "row", alignItems: "center", gap: 3 },
  adButtonText: { ...typography.body2, color: palette.gray0 },
  disabledButton: { opacity: 0.6 },
  readyContent: { flex: 1, alignItems: "center" },
  readyLody: { width: 100, height: 100, marginBottom: 28 },
  readyCaption: { ...typography.body9, color: palette.gray500 },
  readyTimer: { ...typography.head1, color: "#282A31", marginTop: 4 },
  openButton: { height: 40, marginTop: 22, paddingLeft: 16, paddingRight: 10, borderRadius: 39, backgroundColor: palette.accentPrimary400, flexDirection: "row", alignItems: "center", gap: 3 },
  openButtonText: { ...typography.body2, color: palette.gray0 },
  letterWrap: { flex: 1, marginTop: 20, marginHorizontal: 20, marginBottom: 20, borderRadius: 20, overflow: "hidden", backgroundColor: palette.gray30 },
  letterGlow: {
    position: "absolute",
    top: -67,
    right: -41,
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: "rgba(71, 210, 125, 0.07)",
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 0,
        blurRadius: 173.9,
        spreadDistance: 0,
        color: "rgba(71, 210, 125, 0.18)",
      },
    ],
  },
  letter: { minHeight: "100%", paddingTop: 48, paddingHorizontal: 20, paddingBottom: 20 },
  letterLody: { position: "absolute", top: 20, right: 20.39, width: 43.61, height: 39.91 },
  to: { ...typography.body2, color: palette.gray800 },
  letterContent: { ...typography.body10, marginTop: 12, color: palette.gray1000, lineHeight: 26.6 },
  from: { ...typography.body10, marginTop: "auto", paddingTop: 18, color: palette.gray500, textAlign: "right" },
  modalOverlay: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0, 0, 0, 0.2)" },
  rewardModal: { width: 212, height: 251, alignItems: "center", borderRadius: 12, backgroundColor: palette.gray0, paddingTop: 20, paddingHorizontal: 16, paddingBottom: 16 },
  cloverImage: { width: 110, height: 110 },
  rewardTitle: { ...typography.display4, marginTop: 9, color: "#282A31" },
  rewardDescription: { ...typography.body12, marginTop: 4, color: palette.gray500 },
  confirmButton: { width: 180, height: 40, marginTop: 16, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: palette.gray50 },
  confirmButtonText: { ...typography.body3, color: palette.gray900 },
});
