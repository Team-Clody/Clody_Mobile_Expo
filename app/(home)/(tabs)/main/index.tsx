import { router, useFocusEffect } from "expo-router";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  FlatList,
  Modal,
  PanResponder,
  View,
} from "react-native";
import TodayIconKo from "@/assets/icons/weekday-item_ko.svg";
import TodayIconEn from "@/assets/icons/weekday-item_en.svg";
import {
  ReplyAPI,
  type ReplyAdRequest,
  type SupportedReplyLanguage,
} from "@/api/replyAPI";
import CloverRewardBottomSheet from "@/components/CloverRewardBottomSheet";
import i18n from "@/app/i18n/i18n";
import { useAdMobRewarded } from "@/shared/ads";
import { Toast } from "@/shared/components/Toast";
import { useApp } from "@/store/useAppStore";
import { useStorageStore } from "@/store/useStorageStore";
import { HomeContext } from "../../_layout";
import { CharacterScene } from "./_components/CharacterScene";
import { DatePickerSheet } from "./_components/DatePickerSheet";
import { GratitudeCard } from "./_components/GratitudeCard";
import { MainHeader } from "./_components/MainHeader";
import { MonthlyCalendarSheet } from "./_components/MonthlyCalendarSheet";
import {
  CHARACTER_TOP_RATIO,
  EN_MONTH_ITEMS,
  FORCE_REPLY_STATUS_PREVIEW,
  HEADER_ACTION_COLOR,
  SCREEN_WIDTH,
  WEEK_DAYS_EN,
  WEEK_DAYS_KO,
  WEEK_STRIP_LENGTH,
} from "./_constants";
import { localeTextStyle } from "@/shared/theme/localeTypography";
import { isDiaryWritableDate } from "@/shared/utils/diaryDate";
import { useJournalPrompt } from "./_hooks/useJournalPrompt";
import { useMainCalendarData } from "./_hooks/useMainCalendarData";
import { useReplyReadyTime } from "./_hooks/useReplyReadyTime";
import type { ReplyStatus } from "./_types";
import { getDaysInMonth } from "./_utils/calendarDataUtils";
import { formatRemainingTime } from "./_utils/cloverUtils";
import {
  buildWeekStrip,
  formatDateKey,
  isFutureDate,
  isSameDate,
  startOfLocalDay,
  weekStripFlatIndexForDate,
} from "./_utils/dateUtils";

export default function Main() {
  const homeContext = useContext(HomeContext);
  const { isLoggedIn, authReady } = useApp();

  const [showReward, setShowReward] = useState(false);
  const fastReplyRewardAd = useAdMobRewarded("fastReplyReward");
  const shouldReopenReward = useStorageStore((s) => s.shouldReopenReward);
  const setShouldReopenReward = useStorageStore((s) => s.setShouldReopenReward);

  useFocusEffect(
    useCallback(() => {
      if (shouldReopenReward) {
        setShowReward(true);
        setShouldReopenReward(false);
      }
    }, [shouldReopenReward, setShouldReopenReward]),
  );

  const flatListRef = useRef<FlatList>(null);
  const pendingPickedDateRef = useRef<Date | null>(null);
  const pendingFastReplyDateKeyRef = useRef<string | null>(null);
  const pendingFastReplyRequestRef = useRef<ReplyAdRequest | null>(null);
  const today = useMemo(() => new Date(), []);

  const [calendarDate, setCalendarDate] = useState(today);
  const [gratitudeDate, setGratitudeDate] = useState(today);
  const calendarDateRef = useRef<Date>(calendarDate);
  const [diaryCountByDate, setDiaryCountByDate] = useState<Record<string, number>>({});
  const [replyStatusByDate, setReplyStatusByDate] = useState<Record<string, ReplyStatus>>({});
  const [replyReadyAtByDate, setReplyReadyAtByDate] = useState<Record<string, number>>({});
  const [totalCloverCount, setTotalCloverCount] = useState(0);
  const [journalPromptText, setJournalPromptText] = useState("");
  const [nowTickMs, setNowTickMs] = useState(() => Date.now());
  const [visualAreaSize, setVisualAreaSize] = useState({ width: 0, height: 0 });
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "warning";
  } | null>(null);
  const [isStartingFastReplyAd, setIsStartingFastReplyAd] = useState(false);

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth() + 1;

  useEffect(() => {
    calendarDateRef.current = calendarDate;
  }, [calendarDate]);

  useMainCalendarData(
    currentYear,
    currentMonth,
    setDiaryCountByDate,
    setReplyStatusByDate,
    setReplyReadyAtByDate,
    setTotalCloverCount,
  );
  useJournalPrompt(gratitudeDate, setJournalPromptText);

  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerSessionKey, setDatePickerSessionKey] = useState(0);
  const [draftYear, setDraftYear] = useState(today.getFullYear());
  const [draftMonth, setDraftMonth] = useState(today.getMonth() + 1);
  const [draftDay, setDraftDay] = useState(today.getDate());
  const [sheetHeight, setSheetHeight] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const datePickerTranslateY = useRef(new Animated.Value(420)).current;

  const isKo = i18n.locale?.startsWith("ko");
  const supportedLanguage: SupportedReplyLanguage = isKo ? "KO" : "EN";
  const TodayIcon = isKo ? TodayIconKo : TodayIconEn;
  const weekDays = isKo ? WEEK_DAYS_KO : WEEK_DAYS_EN;
  const headerActionTextStyle = localeTextStyle("headerAction", !!isKo, {
    color: HEADER_ACTION_COLOR,
  });
  const levelChipTextStyle = localeTextStyle("levelChip", !!isKo);
  const cloverCountTextStyle = localeTextStyle("cloverCount", !!isKo);

  const todayStart = startOfLocalDay(new Date());
  const selectedStart = startOfLocalDay(gratitudeDate);
  const diffDaysFromToday = Math.max(
    0,
    Math.floor((todayStart.getTime() - selectedStart.getTime()) / 86400000),
  );
  const pastDayBadgeLabel = (() => {
    if (diffDaysFromToday <= 0) return i18n.t("main.gratitude.todayBadge");
    if (diffDaysFromToday === 1) return i18n.t("main.gratitude.pastBadgeYesterday");
    if (diffDaysFromToday >= 365) {
      const years = Math.floor(diffDaysFromToday / 365);
      return isKo ? `${years}년 전` : `${years} year${years > 1 ? "s" : ""} ago`;
    }
    return isKo
      ? `${diffDaysFromToday}일 전`
      : `${diffDaysFromToday} day${diffDaysFromToday > 1 ? "s" : ""} ago`;
  })();
  const pastCardDateLabel = gratitudeDate.toLocaleDateString(
    isKo ? "ko-KR" : "en-US",
    isKo
      ? { month: "long", day: "numeric", weekday: "short" }
      : { weekday: "short", month: "short", day: "numeric" },
  );

  const cloversPerLevel = 2;
  const profileCloverCount = homeContext?.form?.cloverCount ?? 0;
  const effectiveTotalCloverCount = Math.max(totalCloverCount, profileCloverCount);
  const currentLevel = Math.floor(effectiveTotalCloverCount / cloversPerLevel) + 1;
  const currentLevelProgress = effectiveTotalCloverCount % cloversPerLevel;
  const characterTop = useMemo(() => {
    if (!visualAreaSize.height) return 0;
    return Math.round(visualAreaSize.height * CHARACTER_TOP_RATIO);
  }, [visualAreaSize.height]);

  const selectedDateKey = formatDateKey(gratitudeDate);
  const selectedDiaryCount = diaryCountByDate[selectedDateKey] ?? 0;
  const selectedReplyAdRequest = useMemo<ReplyAdRequest>(
    () => ({
      year: gratitudeDate.getFullYear(),
      month: gratitudeDate.getMonth() + 1,
      date: gratitudeDate.getDate(),
      supportedLanguage,
    }),
    [gratitudeDate, supportedLanguage],
  );

  const getDisplayReplyStatusForDate = useCallback(
    (date: Date, diaryCount: number): ReplyStatus => {
      if (FORCE_REPLY_STATUS_PREVIEW && isSameDate(date, gratitudeDate)) {
        return FORCE_REPLY_STATUS_PREVIEW;
      }
      const key = formatDateKey(date);
      const fromApi = replyStatusByDate[key];
      if (fromApi) return fromApi;
      return diaryCount > 0 ? "UNREADY" : "READY_READ";
    },
    [gratitudeDate, replyStatusByDate],
  );

  const selectedReplyStatus = useMemo(
    () => getDisplayReplyStatusForDate(gratitudeDate, selectedDiaryCount),
    [getDisplayReplyStatusForDate, gratitudeDate, selectedDiaryCount],
  );

  const replyReadyDeadlineMs = replyReadyAtByDate[selectedDateKey];
  const selectedReplyReadyAtMs = useMemo(() => {
    if (selectedReplyStatus !== "UNREADY") return null;
    if (replyReadyDeadlineMs != null && replyReadyDeadlineMs > 0) {
      return replyReadyDeadlineMs;
    }
    return null;
  }, [selectedReplyStatus, replyReadyDeadlineMs]);

  useReplyReadyTime(
    selectedReplyStatus,
    selectedDiaryCount,
    selectedDateKey,
    replyReadyDeadlineMs,
    setReplyReadyAtByDate,
  );

  useEffect(() => {
    const pendingDateKey = pendingFastReplyDateKeyRef.current;
    const pendingRequest = pendingFastReplyRequestRef.current;
    if (!fastReplyRewardAd.isEarnedReward || !pendingDateKey || !pendingRequest) {
      return;
    }

    pendingFastReplyDateKeyRef.current = null;
    pendingFastReplyRequestRef.current = null;
    ReplyAPI.endAdViewing(pendingRequest)
      .then(() => {
        setReplyStatusByDate((prev) => ({
          ...prev,
          [pendingDateKey]: "READY_NOT_READ",
        }));
        setReplyReadyAtByDate((prev) => {
          if (!(pendingDateKey in prev)) return prev;
          const next = { ...prev };
          delete next[pendingDateKey];
          return next;
        });
        setToast({
          message: i18n.t("main.gratitude.fastReplyUnlocked"),
          variant: "success",
        });
      })
      .catch((error) => {
        console.warn("[main] fast reply ad end failed", error);
        setToast({
          message: i18n.t("ads.unavailable"),
          variant: "warning",
        });
      });
  }, [fastReplyRewardAd.isEarnedReward]);

  useEffect(() => {
    if (!fastReplyRewardAd.isClosed || !pendingFastReplyDateKeyRef.current) return;
    pendingFastReplyDateKeyRef.current = null;
    pendingFastReplyRequestRef.current = null;
  }, [fastReplyRewardAd.isClosed]);

  useEffect(() => {
    if (!fastReplyRewardAd.error || !pendingFastReplyDateKeyRef.current) return;

    pendingFastReplyDateKeyRef.current = null;
    pendingFastReplyRequestRef.current = null;
    setToast({
      message: i18n.t("ads.unavailable"),
      variant: "warning",
    });
  }, [fastReplyRewardAd.error]);

  const replyRemainingMs =
    selectedReplyReadyAtMs != null
      ? Math.max(0, selectedReplyReadyAtMs - nowTickMs)
      : 0;
  const isFutureSelected = isFutureDate(gratitudeDate);
  const isDraft =
    selectedReplyStatus === "HAS_DRAFT" ||
    selectedReplyStatus === "INVALID_DRAFT";
  const hasSelectedDiary = selectedDiaryCount > 0;
  const isUnready = selectedReplyStatus === "UNREADY" && hasSelectedDiary;
  const isReadyNotRead = selectedReplyStatus === "READY_NOT_READ";
  const isReadyRead = selectedReplyStatus === "READY_READ";
  const showReplyAction =
    hasSelectedDiary && (isReadyNotRead || isReadyRead);
  const showWriteEntry =
    !isFutureSelected && !hasSelectedDiary && !isDraft && !isUnready;
  // 작성 가능일: KST 오늘+어제, 그 외 타임존은 오늘만 (v1 정책)
  const isWritableSelected = isDiaryWritableDate(gratitudeDate);
  const actionLabel = showWriteEntry
    ? i18n.t("main.gratitude.writeEntry")
    : showReplyAction
      ? isKo
        ? "답장확인"
        : "See My Reply"
      : isKo
        ? i18n.t("main.gratitude.continueWriting")
        : "Continue Writing";
  const actionTextColor = showWriteEntry
    ? isWritableSelected
      ? "#13B567"
      : "#ABAFBB"
    : isReadyNotRead
      ? "#00A34A"
      : "#374151";
  const useGreenActionChevron =
    (showWriteEntry && isWritableSelected) || isReadyNotRead;
  const timerText = isKo
    ? `답장 ${formatRemainingTime(replyRemainingMs)} 남음`
    : `Reply available in ${formatRemainingTime(replyRemainingMs)}`;
  const unreadyNoScheduleText = isKo ? "답장 준비 중" : "Reply getting ready";

  const { weeks } = useMemo(() => buildWeekStrip(today), [today]);

  const weekStripExtraData = useMemo(
    () => ({
      diaryCountByDate,
      replyStatusByDate,
      gratitudeKey: formatDateKey(gratitudeDate),
    }),
    [diaryCountByDate, replyStatusByDate, gratitudeDate],
  );

  const scrollWeekStripToDate = (picked: Date, animated = true) => {
    const idx = weekStripFlatIndexForDate(picked, today);
    if (idx < 0 || idx >= WEEK_STRIP_LENGTH) return;
    pendingPickedDateRef.current = picked;
    flatListRef.current?.scrollToOffset({
      offset: SCREEN_WIDTH * idx,
      animated,
    });
  };

  const selectDateFromWeekRow = (picked: Date) => {
    if (isFutureDate(picked)) return;
    setCalendarDate(picked);
    setGratitudeDate(picked);
    scrollWeekStripToDate(picked);
  };

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (pendingPickedDateRef.current) {
      const p = pendingPickedDateRef.current;
      setCalendarDate(p);
      setGratitudeDate(p);
      pendingPickedDateRef.current = null;
      return;
    }
    const week = weeks[index];
    if (!week) return;
    const prev = calendarDateRef.current;
    const mondayFirstIndex = (prev.getDay() + 6) % 7;
    setCalendarDate(week[mondayFirstIndex]);
  };

  const goToToday = () => {
    setCalendarDate(today);
    setGratitudeDate(today);
    scrollWeekStripToDate(today);
  };

  const openMonthly = () => {
    setIsMonthlyOpen(true);
    requestAnimationFrame(() => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeMonthly = () => {
    Animated.timing(translateY, {
      toValue: -sheetHeight,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setIsMonthlyOpen(false));
  };

  const openDatePicker = () => {
    setDraftYear(calendarDate.getFullYear());
    setDraftMonth(calendarDate.getMonth() + 1);
    setDraftDay(calendarDate.getDate());
    setDatePickerSessionKey((prev) => prev + 1);
    datePickerTranslateY.setValue(420);
    setIsDatePickerOpen(true);
    requestAnimationFrame(() => {
      Animated.timing(datePickerTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeDatePicker = (onClosed?: () => void) => {
    Animated.timing(datePickerTranslateY, {
      toValue: 420,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setIsDatePickerOpen(false);
      onClosed?.();
    });
  };

  const applyTodayAndClose = () => {
    const now = new Date();
    setDraftYear(now.getFullYear());
    setDraftMonth(now.getMonth() + 1);
    setDraftDay(now.getDate());
  };

  const applyPickedDateAndClose = () => {
    const safeDay = Math.min(draftDay, getDaysInMonth(draftYear, draftMonth));
    const draftPickedDate = new Date(draftYear, draftMonth - 1, safeDay);
    const pickedDate = isFutureDate(draftPickedDate) ? today : draftPickedDate;
    setCalendarDate(pickedDate);
    setGratitudeDate(pickedDate);
    closeDatePicker(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollWeekStripToDate(pickedDate);
          setTimeout(() => scrollWeekStripToDate(pickedDate, false), 60);
        });
      });
    });
  };

  const yearItems = useMemo(
    () =>
      Array.from({ length: 2100 - 1900 + 1 }, (_, i) =>
        isKo ? `${1900 + i}년` : `${1900 + i}`,
      ),
    [isKo],
  );
  const monthItems = useMemo(
    () =>
      isKo ? Array.from({ length: 12 }, (_, i) => `${i + 1}월`) : EN_MONTH_ITEMS,
    [isKo],
  );
  const dayItems = useMemo(
    () =>
      Array.from({ length: getDaysInMonth(draftYear, draftMonth) }, (_, i) =>
        isKo ? `${i + 1}일` : `${i + 1}`,
      ),
    [isKo, draftYear, draftMonth],
  );

  useEffect(() => {
    const maxDay = getDaysInMonth(draftYear, draftMonth);
    if (draftDay > maxDay) {
      setDraftDay(maxDay);
    }
  }, [draftYear, draftMonth, draftDay]);

  useEffect(() => {
    const interval = setInterval(() => setNowTickMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        translateY.stopAnimation((value) => {
          if (value < -sheetHeight * 0.25) {
            closeMonthly();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        });
      },
      onPanResponderMove: (_, gestureState) => {
        let newY = gestureState.dy;
        newY = Math.max(-sheetHeight, newY);
        if (newY > 0) newY = newY * 0.5;
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        const distance = gestureState.dy;
        const translateYValue =
          typeof (translateY as Animated.Value & { __getValue?: () => number }).__getValue ===
          "function"
            ? (translateY as Animated.Value & { __getValue: () => number }).__getValue()
            : 0;
        if (velocity < -0.35 || distance < -18 || translateYValue < -35) {
          closeMonthly();
          return;
        }
        if (distance > 120) {
          closeMonthly();
          return;
        }
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const handleSheetLayout = (height: number) => {
    if (height !== sheetHeight) {
      setSheetHeight(height);
      if (!isMonthlyOpen) {
        translateY.setValue(-height);
      }
    }
  };

  const handleGratitudeAction = () => {
    if (showReplyAction) {
      // TODO: 답장 확인 화면 연결
      console.log("[main] 답장확인 - 미구현");
      return;
    }
    if (showWriteEntry && !isWritableSelected) return;
    // 일기쓰기 / 이어쓰기 → 일기 작성 화면 (임시저장 프리필은 작성 화면이 직접 조회)
    router.push({
      pathname: "/(home)/diaryWrite" as never,
      params: { date: selectedDateKey },
    });
  };

  const handlePressFastReplyAd = async () => {
    if (!isUnready || fastReplyRewardAd.isShowing || isStartingFastReplyAd) return;

    if (!fastReplyRewardAd.isLoaded) {
      fastReplyRewardAd.load();
      setToast({
        message: i18n.t("ads.notReady"),
        variant: "warning",
      });
      return;
    }

    setIsStartingFastReplyAd(true);
    try {
      await ReplyAPI.startAdViewing(selectedReplyAdRequest);
    } catch (error) {
      console.warn("[main] fast reply ad start failed", error);
      setToast({
        message: i18n.t("ads.unavailable"),
        variant: "warning",
      });
      return;
    } finally {
      setIsStartingFastReplyAd(false);
    }

    pendingFastReplyDateKeyRef.current = selectedDateKey;
    pendingFastReplyRequestRef.current = selectedReplyAdRequest;
    const didShowAd = fastReplyRewardAd.showAd();
    if (didShowAd) return;

    pendingFastReplyDateKeyRef.current = null;
    pendingFastReplyRequestRef.current = null;
    setToast({
      message: i18n.t("ads.notReady"),
      variant: "warning",
    });
  };

  const datePickerLayer = (
    <DatePickerSheet
      translateY={datePickerTranslateY}
      isKo={!!isKo}
      datePickerSessionKey={datePickerSessionKey}
      draftYear={draftYear}
      draftMonth={draftMonth}
      draftDay={draftDay}
      yearItems={yearItems}
      monthItems={monthItems}
      dayItems={dayItems}
      onClose={() => closeDatePicker()}
      onDraftYearChange={setDraftYear}
      onDraftMonthChange={setDraftMonth}
      onDraftDayChange={setDraftDay}
      onApplyToday={applyTodayAndClose}
      onConfirm={applyPickedDateAndClose}
    />
  );

  if (!authReady || !isLoggedIn) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F9FC" }}>
      <MainHeader
        calendarDate={calendarDate}
        gratitudeDate={gratitudeDate}
        weekDays={weekDays}
        weeks={weeks}
        flatListRef={flatListRef}
        weekStripExtraData={weekStripExtraData}
        diaryCountByDate={diaryCountByDate}
        headerActionTextStyle={headerActionTextStyle}
        getDisplayReplyStatusForDate={getDisplayReplyStatusForDate}
        onOpenDatePicker={openDatePicker}
        onGoToToday={goToToday}
        onOpenMonthly={openMonthly}
        onSelectDate={selectDateFromWeekRow}
        onWeekScrollEnd={handleScroll}
      />

      <View
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          alignSelf: "stretch",
          marginTop: 20,
          backgroundColor: "#F8F9FC",
          overflow: "hidden",
        }}
      >
        <CharacterScene
          characterTop={characterTop}
          isKo={!!isKo}
          currentLevel={currentLevel}
          effectiveTotalCloverCount={effectiveTotalCloverCount}
          cloversPerLevel={cloversPerLevel}
          currentLevelProgress={currentLevelProgress}
          levelChipTextStyle={levelChipTextStyle}
          cloverCountTextStyle={cloverCountTextStyle}
          onOpenReward={() => setShowReward(true)}
          onLayout={(width, height) => {
            setVisualAreaSize((prev) =>
              prev.width === width && prev.height === height ? prev : { width, height },
            );
          }}
        />
        <GratitudeCard
          gratitudeDate={gratitudeDate}
          isKo={!!isKo}
          journalPromptText={journalPromptText}
          pastDayBadgeLabel={pastDayBadgeLabel}
          pastCardDateLabel={pastCardDateLabel}
          isUnready={isUnready}
          isReadyNotRead={isReadyNotRead}
          selectedReplyReadyAtMs={selectedReplyReadyAtMs}
          timerText={timerText}
          unreadyNoScheduleText={unreadyNoScheduleText}
          actionLabel={actionLabel}
          actionTextColor={actionTextColor}
          useGreenActionChevron={useGreenActionChevron}
          onPressFastReplyAd={handlePressFastReplyAd}
          onPressAction={handleGratitudeAction}
        />
      </View>

      <Modal
        transparent
        visible={isMonthlyOpen}
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        <MonthlyCalendarSheet
          translateY={translateY}
          sheetHeight={sheetHeight}
          calendarDate={calendarDate}
          today={today}
          gratitudeDate={gratitudeDate}
          weekDays={weekDays}
          isKo={!!isKo}
          TodayIcon={TodayIcon}
          diaryCountByDate={diaryCountByDate}
          panHandlers={panResponder.panHandlers}
          datePickerLayer={datePickerLayer}
          isDatePickerOpen={isDatePickerOpen}
          getDisplayReplyStatusForDate={getDisplayReplyStatusForDate}
          onClose={closeMonthly}
          onOpenDatePicker={openDatePicker}
          onSelectDate={selectDateFromWeekRow}
          onSheetLayout={handleSheetLayout}
        />
      </Modal>

      <Modal
        transparent
        visible={isDatePickerOpen && !isMonthlyOpen}
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        {datePickerLayer}
      </Modal>

      <CloverRewardBottomSheet
        visible={showReward}
        onClose={() => setShowReward(false)}
      />
      <Toast
        message={toast?.message ?? ""}
        visible={toast !== null}
        variant={toast?.variant}
        onHide={() => setToast(null)}
      />
    </View>
  );
}
