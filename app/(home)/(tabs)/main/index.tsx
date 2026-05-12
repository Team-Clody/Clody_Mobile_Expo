import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  View,
  Image,
  FlatList,
  Dimensions,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
  Modal,
  PanResponder,
  Easing,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { HomeContext } from "../../_layout";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { logCalendarDiaryQuery } from "@/shared/utils/debugCalendarDiaries";
import { getDeviceTimeZone } from "@/shared/utils/timezone";
import authService from "@/services/authService";
import { DiaryAPI } from "@/api/diaryAPI";
import { diaryCreatedToReplyReadyMs } from "@/shared/utils/diaryReplyTimer";
import i18n from "@/app/i18n/i18n";
import CloverIcon from "@/assets/icons/ic_clover.svg";
import DownIcon from "@/assets/icons/ic_down.svg";
import PromptIcon from "@/assets/icons/ic_prompt.svg";
import ChevronGreenIcon from "@/assets/icons/Vector_gr.svg";
import ChevronDarkIcon from "@/assets/icons/Vector_bk.svg";
import TodayIconKo from "@/assets/icons/weekday-item_ko.svg";
import TodayIconEn from "@/assets/icons/weekday-item_en.svg";
import NewIcon from "@/assets/icons/ic_new.svg";
import AdToReplyKoIcon from "@/assets/icons/btn_ad_to_reply_ko.svg";
import AdToReplyEnIcon from "@/assets/icons/btn_ad_to_reply_en.svg";
import ReplyUnreadDotIcon from "@/assets/Ellipse2636.svg";
import DotDotDotIcon from "@/assets/icons/dotdotdot.svg";
import WheelPicker from "@/components/WheelPicker";
import { GradientText } from "@/components/GradientText";
import GroupCharacter from "@/assets/images/Group.svg";
import CloverRewardBottomSheet from "@/components/CloverRewardBottomSheet";
import { useStorageStore } from "@/store/useStorageStore";
import { useFocusEffect } from "expo-router";
import { useApp } from "@/store/useAppStore";

const bgDefaultPng = require("../../../../assets/images/bg_default.png");
const { width } = Dimensions.get("window");

const WEEK_DAYS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const WEEK_DAYS_KO = ["월", "화", "수", "목", "금", "토", "일"];
const fontPreset = StyleSheet.create({
  regular: { fontFamily: "PretendardRegular" },
  medium: { fontFamily: "PretendardMedium" },
  semibold: { fontFamily: "PretendardSemiBold" },
  bold: { fontFamily: "PretendardBold" },
});

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};  

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** ±7000주 ≈ ±95년. 기존 ±50주는 1년도 못 벗어나 피커에서 년만 바꾸면 스트립에 해당 주가 없었음 */
const WEEK_STRIP_HALF_SPAN = 7000;
const WEEK_STRIP_CENTER_INDEX = WEEK_STRIP_HALF_SPAN;
const WEEK_STRIP_LENGTH = WEEK_STRIP_HALF_SPAN * 2 + 1;

/** `picked`가 속한 주가 FlatList에서 몇 번째 페이지인지 (오늘이 있는 주 = WEEK_STRIP_CENTER_INDEX) */
const weekStripFlatIndexForDate = (picked: Date, anchorToday: Date) => {
  const p = new Date(picked.getFullYear(), picked.getMonth(), picked.getDate());
  const a = new Date(
    anchorToday.getFullYear(),
    anchorToday.getMonth(),
    anchorToday.getDate(),
  );
  const pw = getStartOfWeek(p);
  const aw = getStartOfWeek(a);
  const pu = Date.UTC(pw.getFullYear(), pw.getMonth(), pw.getDate());
  const au = Date.UTC(aw.getFullYear(), aw.getMonth(), aw.getDate());
  const diffWeeks = Math.round((pu - au) / (7 * 86400000));
  return WEEK_STRIP_CENTER_INDEX + diffWeeks;
};

const formatMonth = (date: Date) => {
  const locale = i18n.locale?.startsWith("ko") ? "ko-KR" : "en-US";
  return date.toLocaleString(locale, {
    month: "long",
    year: "numeric",
  });
};

const isSameDate = (a: Date, b: Date) => {
  return a.toDateString() === b.toDateString();
};

const isCalendarToday = (d: Date) => {
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
};

const startOfLocalDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const isFutureDate = (d: Date) => startOfLocalDay(d) > startOfLocalDay(new Date());

/** 감사 카드 슬롯 고정 높이 — 있을 때/없을 때 동일하게 유지해 캐릭터·레벨 위치 고정 */
const GRATITUDE_SLOT_MARGIN_TOP = 40;
const GRATITUDE_SLOT_HEIGHT = 326;
const GRATITUDE_SCROLL_PADDING_TOP = 92;
/**
 * bg_default.png 가로:세로 비율(약 1:1).
 * width:100%/aspectRatio로 높이를 고정해 기기별 크기 차이를 줄임.
 */
const BG_DEFAULT_ASPECT_RATIO = 1;
const BG_CENTER_TRANSLATE_Y = 18;
const CHARACTER_TOP_RATIO = 0.4;
/** 탭 바 상단과 감사 카드 슬롯 사이 간격(씬은 이미 탭 위 영역이므로 insets.bottom 미가산) */
const GRATITUDE_ABOVE_TAB_BAR = 12;

const DUMMY_JOURNAL_PROMPT_KO =
  '"버텨줘서 고마워"라고 말해주고 싶은 나의 모습을 적어보세요.';
const DUMMY_JOURNAL_PROMPT_EN =
  "Write about the version of yourself you want to say, 'Thank you for holding on.'";

type CalendarDiary = {
  diaryCount: number;
  replyStatus?: ReplyStatus;
  date: string;
  diary?: Array<{ content: string }>;
  isDeleted?: boolean;
  replyAvailableAt?: string;
};

type ReplyStatus =
  | "UNREADY"
  | "READY_NOT_READ"
  | "READY_READ"
  | "HAS_DRAFT"
  | "INVALID_DRAFT";

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// QA/디자인 확인용: null이면 API 값 사용, 값 지정하면 해당 날짜만 강제
const FORCE_REPLY_STATUS_PREVIEW: ReplyStatus | null = null;

const formatRemainingTime = (ms: number) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const getDisplayCloverColor = (diaryCount: number, replyStatus: ReplyStatus) => {
  // 답장 열람 완료(READY_READ)일 때만 색상 클로버 노출
  if (replyStatus !== "READY_READ") return "#D1D5DD";
  return getCloverColorByCount(diaryCount);
};

const getCloverColorByCount = (count: number) => {
  if (count <= 0) return "#D1D5DD";
  if (count === 1) return "#8FF76F";
  if (count <= 3) return "#00D15A";
  return "#00974E";
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

/** 오늘(로컬)보다 이후 날짜는 일기가 있을 수 없음 — API 값도 0으로 통일 */
const zeroDiaryCountsAfterToday = (map: Record<string, number>) => {
  const todayStart = startOfLocalDay(new Date());
  const next = { ...map };
  for (const key of Object.keys(next)) {
    const parts = key.split("-");
    if (parts.length !== 3) continue;
    const y = Number(parts[0]);
    const mo = Number(parts[1]);
    const da = Number(parts[2]);
    if (!y || !mo || !da) continue;
    const d = startOfLocalDay(new Date(y, mo - 1, da));
    if (d > todayStart) {
      next[key] = 0;
    }
  }
  return next;
};

const buildDiaryCountMap = (diaries: CalendarDiary[]) => {
  const diaryCountMap = diaries.reduce<Record<string, number>>((acc, diaryItem) => {
    acc[diaryItem.date] = diaryItem.diaryCount ?? 0;
    return acc;
  }, {});
  return zeroDiaryCountsAfterToday(diaryCountMap);
};

const buildReplyMetaMaps = (diaries: CalendarDiary[]) => {
  const replyStatusByDate: Record<string, ReplyStatus> = {};
  const replyReadyAtByDate: Record<string, number> = {};
  for (const diaryItem of diaries) {
    if (diaryItem.replyStatus) {
      replyStatusByDate[diaryItem.date] = diaryItem.replyStatus;
    }
    if (diaryItem.replyAvailableAt) {
      const t = Date.parse(diaryItem.replyAvailableAt);
      if (!Number.isNaN(t)) {
        replyReadyAtByDate[diaryItem.date] = t;
      }
    }
  }
  return { replyStatusByDate, replyReadyAtByDate };
};

// 🔥 Monthly Matrix 생성
const getMonthMatrix = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();

  const matrix = [];
  let current = 1 - (startDay === 0 ? 6 : startDay - 1);

  for (let row = 0; row < 6; row++) {
    const week = [];
    for (let col = 0; col < 7; col++) {
      week.push(new Date(year, month, current));
      current++;
    }
    matrix.push(week);
  }

  return matrix;
};


export default function Main() {
  const homeContext = useContext(HomeContext);
  const router = useRouter();
  const { isLoggedIn, authReady } = useApp();

 

  const [showReward, setShowReward] = useState(false);
  const shouldReopenReward = useStorageStore(
    (s: { shouldReopenReward: boolean }) => s.shouldReopenReward,
  );
  const setShouldReopenReward = useStorageStore(
    (s: { setShouldReopenReward: (value: boolean) => void }) =>
      s.setShouldReopenReward,
  );

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

  const today = new Date();
  /** 헤더·주간 스와이프·월별 시트 등 캘린더 UI 포커스 */
  const [calendarDate, setCalendarDate] = useState(today);
  /** 하단 감사 주제 카드에 쓰는 날짜 (클로버 탭 / 오늘 / 날짜 피커에서만 변경) */
  const [gratitudeDate, setGratitudeDate] = useState(today);
  const calendarDateRef = useRef<Date>(calendarDate);
  const [diaryCountByDate, setDiaryCountByDate] = useState<
    Record<string, number>
  >({});
  const [replyStatusByDate, setReplyStatusByDate] = useState<
    Record<string, ReplyStatus>
  >({});
  const [replyReadyAtByDate, setReplyReadyAtByDate] = useState<
    Record<string, number>
  >({});
  const [totalCloverCount, setTotalCloverCount] = useState(0);
  const [journalPromptText, setJournalPromptText] = useState("");
  const [nowTickMs, setNowTickMs] = useState(() => Date.now());
  const [visualAreaSize, setVisualAreaSize] = useState({ width: 0, height: 0 });
  const fetchedMonthKeysRef = useRef<Set<string>>(new Set());
  const fetchingMonthKeysRef = useRef<Set<string>>(new Set());
  /** 같은 날·로케일로 다시 오늘 선택 시 journal/prompt 재호출 방지 */
  const journalPromptCacheRef = useRef<Map<string, string>>(new Map());
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth() + 1;
  useEffect(() => {
    calendarDateRef.current = calendarDate;
  }, [calendarDate]);

  useEffect(() => {
    console.log("[TEST] calendarDate:", calendarDate, "gratitudeDate:", gratitudeDate);
  }, [calendarDate, gratitudeDate]);
  useEffect(() => {
    const fetchCalendar = async () => {
      const timeZone = getDeviceTimeZone();
      const requestCalendarList = async (
        accessToken: string,
        year: number,
        month: number,
      ) => {
        return axios.get("https://test.clodycorp.com/api/v1/calendar/list", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Time-Zone": timeZone,
          },
          params: {
            year,
            month,
          },
        });
      };
      const mergeMonthDiaryCount = (diaries: CalendarDiary[], totalClover: number) => {
        const diaryCountMap = buildDiaryCountMap(diaries);
        const { replyStatusByDate: rs, replyReadyAtByDate: rr } =
          buildReplyMetaMaps(diaries);
        setDiaryCountByDate((prev) => ({ ...prev, ...diaryCountMap }));
        setReplyStatusByDate((prev) => ({ ...prev, ...rs }));
        setReplyReadyAtByDate((prev) => ({ ...prev, ...rr }));
        setTotalCloverCount(totalClover);
      };
      const fetchMonth = async (
        accessToken: string,
        year: number,
        month: number,
      ) => {
        const monthKey = `${year}-${String(month).padStart(2, "0")}`;
        if (
          fetchedMonthKeysRef.current.has(monthKey) ||
          fetchingMonthKeysRef.current.has(monthKey)
        ) {
          return;
        }

        fetchingMonthKeysRef.current.add(monthKey);
        try {
          const resp = await requestCalendarList(accessToken, year, month);
          logCalendarDiaryQuery("Main.fetchMonth", year, month, resp.data?.data);
          const diaries = (resp.data?.data?.diaries ?? []) as CalendarDiary[];
          const totalClover = Number(resp.data?.data?.totalCloverCount ?? 0);
          mergeMonthDiaryCount(diaries, totalClover);
          fetchedMonthKeysRef.current.add(monthKey);
        } finally {
          fetchingMonthKeysRef.current.delete(monthKey);
        }
      };
      const getNeighborMonth = (year: number, month: number, diff: number) => {
        const date = new Date(year, month - 1 + diff, 1);
        return { year: date.getFullYear(), month: date.getMonth() + 1 };
      };

      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (!accessToken) {
          console.warn("[TEST] accessToken is missing");
          return;
        }

        await fetchMonth(accessToken, currentYear, currentMonth);
        const prevMonth = getNeighborMonth(currentYear, currentMonth, -1);
        const nextMonth = getNeighborMonth(currentYear, currentMonth, 1);
        // 인접 월은 화면 반응성을 위해 백그라운드 prefetch
        void fetchMonth(accessToken, prevMonth.year, prevMonth.month);
        void fetchMonth(accessToken, nextMonth.year, nextMonth.month);

        console.log("[TEST] baseURL:", "https://test.clodycorp.com");
        console.log("[TEST] timeZone:", timeZone);
        console.log(
          "[TEST] calendar/list year, month:",
          currentYear,
          currentMonth,
        );
        console.log("[TEST] calendar/list fetched + prefetched");
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          try {
            const refreshToken = await SecureStore.getItemAsync("refreshToken");
            const reissued =
              await authService.reissueWithRefreshToken(refreshToken);

            if (!reissued) {
              console.error("[TEST] token reissue failed");
              return;
            }

            const newAccessToken = await SecureStore.getItemAsync("accessToken");
            if (!newAccessToken) {
              console.error("[TEST] new accessToken is missing after reissue");
              return;
            }

            await fetchMonth(newAccessToken, currentYear, currentMonth);
            const prevMonth = getNeighborMonth(currentYear, currentMonth, -1);
            const nextMonth = getNeighborMonth(currentYear, currentMonth, 1);
            void fetchMonth(newAccessToken, prevMonth.year, prevMonth.month);
            void fetchMonth(newAccessToken, nextMonth.year, nextMonth.month);
            console.log("[TEST] calendar/list retried with prefetch");
            return;
          } catch (retryError) {
            console.error("[TEST] calendar/list retry error:", retryError);
            return;
          }
        }

        console.error("[TEST] calendar/list error:", error);
      }
    };

    fetchCalendar();
  }, [currentYear, currentMonth]);

  useEffect(() => {
    if (!isCalendarToday(gratitudeDate)) {
      return;
    }

    const promptCacheKey = `${formatDateKey(gratitudeDate)}|${i18n.locale ?? ""}`;
    const cachedPrompt = journalPromptCacheRef.current.get(promptCacheKey);
    if (cachedPrompt !== undefined) {
      setJournalPromptText(cachedPrompt);
      return;
    }

    let cancelled = false;
    const dummy = i18n.locale?.startsWith("ko")
      ? DUMMY_JOURNAL_PROMPT_KO
      : DUMMY_JOURNAL_PROMPT_EN;

    const commitPrompt = (text: string) => {
      if (cancelled) return;
      journalPromptCacheRef.current.set(promptCacheKey, text);
      setJournalPromptText(text);
    };

    const run = async () => {
      const timeZone = getDeviceTimeZone();
      const month = gratitudeDate.getMonth() + 1;
      const date = gratitudeDate.getDate();

      const requestJournalPrompt = async (accessToken: string) =>
        axios.get("https://test.clodycorp.com/api/v1/journal/prompt", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Time-Zone": timeZone,
          },
          params: { month, date },
        });

      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (!accessToken) {
          commitPrompt(dummy);
          return;
        }

        try {
          const resp = await requestJournalPrompt(accessToken);
          const text = String(resp.data?.data?.prompt ?? "").trim();
          commitPrompt(text || dummy);
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            try {
              const refreshToken = await SecureStore.getItemAsync("refreshToken");
              const reissued =
                await authService.reissueWithRefreshToken(refreshToken);
              if (reissued) {
                const newAccessToken = await SecureStore.getItemAsync("accessToken");
                if (newAccessToken) {
                  const resp2 = await requestJournalPrompt(newAccessToken);
                  const text = String(resp2.data?.data?.prompt ?? "").trim();
                  commitPrompt(text || dummy);
                  return;
                }
              }
            } catch {
              /* fall through to dummy */
            }
          }
          commitPrompt(dummy);
        }
      } catch {
        commitPrompt(dummy);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [gratitudeDate, i18n.locale]);

  // 🔥 Monthly 상태
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
  const TodayIcon = isKo ? TodayIconKo : TodayIconEn;
  const weekDays = isKo ? WEEK_DAYS_KO : WEEK_DAYS_EN;
  const headerActionTextStyle = isKo
    ? [fontPreset.medium, { fontWeight: "500" as const }]
    : [fontPreset.regular, { fontWeight: "400" as const }];
  const levelChipTextStyle = isKo
    ? [fontPreset.bold, { fontWeight: "700" as const }]
    : [fontPreset.semibold, { fontWeight: "600" as const }];
  const cloverCountTextStyle = isKo
    ? [fontPreset.semibold, { fontWeight: "600" as const }]
    : [fontPreset.medium, { fontWeight: "500" as const }];
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
  const getDisplayReplyStatusForDate = (date: Date, diaryCount: number): ReplyStatus => {
    if (FORCE_REPLY_STATUS_PREVIEW && isSameDate(date, gratitudeDate)) {
      return FORCE_REPLY_STATUS_PREVIEW;
    }
    const key = formatDateKey(date);
    const fromApi = replyStatusByDate[key];
    if (fromApi) {
      return fromApi;
    }
    return diaryCount > 0 ? "UNREADY" : "READY_READ";
  };
  const selectedReplyStatus = useMemo(() => {
    return getDisplayReplyStatusForDate(gratitudeDate, selectedDiaryCount);
  }, [selectedDateKey, selectedDiaryCount, gratitudeDate, replyStatusByDate]);
  const replyReadyDeadlineMs = replyReadyAtByDate[selectedDateKey];
  const selectedReplyReadyAtMs = useMemo(() => {
    if (selectedReplyStatus !== "UNREADY") return null;
    if (replyReadyDeadlineMs != null && replyReadyDeadlineMs > 0) {
      return replyReadyDeadlineMs;
    }
    return null;
  }, [selectedDateKey, selectedReplyStatus, replyReadyDeadlineMs]);
  const replyRemainingMs =
    selectedReplyReadyAtMs != null
      ? Math.max(0, selectedReplyReadyAtMs - nowTickMs)
      : 0;
  const isUnready = selectedReplyStatus === "UNREADY";
  const isReadyNotRead = selectedReplyStatus === "READY_NOT_READ";
  const isReadyRead = selectedReplyStatus === "READY_READ";
  const actionLabel = isReadyNotRead || isReadyRead
    ? (isKo ? "답장확인" : "See My Reply")
    : (isKo ? i18n.t("main.gratitude.continueWriting") : "Continue Writing");
  const actionTextColor = isReadyNotRead ? "#00A34A" : "#374151";
  const timerText = isKo
    ? `답장 ${formatRemainingTime(replyRemainingMs)} 남음`
    : `Reply available in ${formatRemainingTime(replyRemainingMs)}`;
  const unreadyNoScheduleText = isKo ? "답장 준비 중" : "Reply getting ready";
  const AdToReplyIcon = isKo ? AdToReplyKoIcon : AdToReplyEnIcon;

  useEffect(() => {
    if (selectedReplyStatus !== "UNREADY" || selectedDiaryCount <= 0) {
      return;
    }
    if (replyReadyDeadlineMs != null && replyReadyDeadlineMs > 0) {
      return;
    }

    let cancelled = false;
    const dateKey = selectedDateKey;
    const ymd = selectedDateKey.split("-").map(Number);
    const year = ymd[0];
    const month = ymd[1];
    const date = ymd[2];
    if (!year || !month || !date) {
      return;
    }

    const tryFetch = async (token: string) => {
      const data = await DiaryAPI.getDiaryCreatedTime(year, month, date);
      if (cancelled) return;
      const readyMs = diaryCreatedToReplyReadyMs(data);
      if (readyMs == null) return;
      setReplyReadyAtByDate((prev) => {
        if (prev[dateKey] != null && prev[dateKey]! > 0) {
          return prev;
        }
        return { ...prev, [dateKey]: readyMs };
      });
    };

    void (async () => {
      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (!accessToken || cancelled) return;
        try {
          await tryFetch(accessToken);
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            try {
              const refreshToken = await SecureStore.getItemAsync("refreshToken");
              const reissued =
                await authService.reissueWithRefreshToken(refreshToken);
              if (reissued && !cancelled) {
                const newToken = await SecureStore.getItemAsync("accessToken");
                if (newToken) {
                  try {
                    await tryFetch(newToken);
                  } catch {
                    /* 404 등 */
                  }
                }
              }
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        /* no token */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedReplyStatus, selectedDiaryCount, selectedDateKey, replyReadyDeadlineMs]);

  const todayYmd = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const weeks = useMemo(() => {
    return Array.from({ length: WEEK_STRIP_LENGTH }, (_, i) => {
      const start = getStartOfWeek(
        addDays(today, (i - WEEK_STRIP_CENTER_INDEX) * 7),
      );
      return Array.from({ length: 7 }, (_, j) => addDays(start, j));
    });
  }, [todayYmd]);

  /** weeks 참조는 자정이 지나기 전까지 같아서, 일기/답장 상태가 바뀌어도 FlatList가 셀을 다시 안 그릴 수 있음 → extraData로 갱신 */
  const weekStripExtraData = useMemo(
    () => ({
      diaryCountByDate,
      replyStatusByDate,
      gratitudeKey: formatDateKey(gratitudeDate),
    }),
    [diaryCountByDate, replyStatusByDate, gratitudeDate],
  );

  /** 주간 스트립을 `picked`가 포함된 주로 맞춤 (`scrollToOffset`이 모달 직후에도 더 안정적) */
  const scrollWeekStripToDate = (picked: Date, animated = true) => {
    const idx = weekStripFlatIndexForDate(picked, today);
    if (idx < 0 || idx >= WEEK_STRIP_LENGTH) return;
    pendingPickedDateRef.current = picked;
    flatListRef.current?.scrollToOffset({
      offset: width * idx,
      animated,
    });
  };

  const selectDateFromWeekRow = (picked: Date) => {
    if (isFutureDate(picked)) return;
    setCalendarDate(picked);
    setGratitudeDate(picked);
    scrollWeekStripToDate(picked);
  };

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);

    // DatePicker·클로버 탭 선택 직후 스크롤은 pending 날짜를 우선 반영
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

  // 🔥 Monthly 열기
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
    // 모달이 완전히 닫힌 뒤 스크롤해야 FlatList 오프셋이 반영됨
    closeDatePicker(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollWeekStripToDate(pickedDate);
          // 레이아웃 직후 한 번 더 맞춤 (일부 기기에서 첫 scrollToOffset 무시됨)
          setTimeout(() => scrollWeekStripToDate(pickedDate, false), 60);
        });
      });
    });
  };
  const getNumericValue = (value: string) => Number(value.replace(/\D/g, ""));
  const enMonthItems = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const yearItems = useMemo(
    () =>
      Array.from(
        { length: 2100 - 1900 + 1 },
        (_, i) => (isKo ? `${1900 + i}년` : `${1900 + i}`),
      ),
    [isKo],
  );
  const monthItems = useMemo(
    () =>
      isKo
        ? Array.from({ length: 12 }, (_, i) => `${i + 1}월`)
        : enMonthItems,
    [isKo],
  );
  const dayItems = useMemo(
    () =>
      Array.from(
        { length: getDaysInMonth(draftYear, draftMonth) },
        (_, i) => (isKo ? `${i + 1}일` : `${i + 1}`),
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
    const interval = setInterval(() => {
      setNowTickMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const selectedWeekdayIndex = (gratitudeDate.getDay() + 6) % 7;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },

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

        // 위로 이동 제한 없음 (닫히는 방향)
        newY = Math.max(-sheetHeight, newY);

        // 아래는 오버드래그
        if (newY > 0) {
          newY = newY * 0.5;
        }

        translateY.setValue(newY);
      },

      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        const distance = gestureState.dy;
        const translateYValue =
          typeof (translateY as any).__getValue === "function"
            ? (translateY as any).__getValue()
            : 0;

        // 🔥 위로 스와이프 또는 충분히 끌어올림 → 닫기
        if (velocity < -0.35 || distance < -18 || translateYValue < -35) {
          closeMonthly();
          return;
        }
        // 🔥 아래로 많이 끌면 닫기
        if (distance > 120) {
          closeMonthly();
          return;
        }

        // 🔥 아니면 원위치
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const renderDatePickerLayer = () => (
    <>
      <Pressable
        onPress={() => closeDatePicker()}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 20,
          paddingHorizontal: 20,
          paddingBottom: 30,
          transform: [{ translateY: datePickerTranslateY }],
        }}
      >
        <Text
          style={[
            fontPreset.bold,
            { fontSize: 16, color: "#20232a", marginBottom: 18 },
          ]}
        >
          {i18n.t("main.datePicker.title")}
        </Text>
        <View
          style={{
            height: 220,
            marginBottom: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {isKo ? (
            <>
              <WheelPicker
                key={`ko-year-${datePickerSessionKey}`}
                items={yearItems}
                initValue={`${draftYear}년`}
                itemHeight={44}
                fontFamily="PretendardSemiBold"
                onItemChange={(item) => {
                  const nextYear = getNumericValue(item);
                  if (!Number.isFinite(nextYear)) return;
                  setDraftYear(nextYear);
                }}
                containerStyle={{ width: 104 }}
              />
              <WheelPicker
                key={`ko-month-${datePickerSessionKey}`}
                items={monthItems}
                initValue={`${draftMonth}월`}
                itemHeight={44}
                fontFamily="PretendardSemiBold"
                onItemChange={(item) => {
                  const nextMonth = getNumericValue(item);
                  if (!Number.isFinite(nextMonth)) return;
                  if (nextMonth < 1 || nextMonth > 12) return;
                  setDraftMonth(nextMonth);
                }}
                containerStyle={{ width: 92 }}
              />
              <WheelPicker
                key={`ko-day-${datePickerSessionKey}`}
                items={dayItems}
                initValue={`${draftDay}일`}
                itemHeight={44}
                fontFamily="PretendardSemiBold"
                onItemChange={(item) => {
                  const nextDay = getNumericValue(item);
                  if (!Number.isFinite(nextDay)) return;
                  if (nextDay < 1 || nextDay > getDaysInMonth(draftYear, draftMonth))
                    return;
                  setDraftDay(nextDay);
                }}
                containerStyle={{ width: 92 }}
              />
            </>
          ) : (
            <>
              <WheelPicker
                key={`en-month-${datePickerSessionKey}`}
                items={monthItems}
                initValue={monthItems[draftMonth - 1]}
                itemHeight={44}
                onItemChange={(item) => {
                  const nextMonth = monthItems.indexOf(item) + 1;
                  if (!Number.isFinite(nextMonth)) return;
                  if (nextMonth < 1 || nextMonth > 12) return;
                  setDraftMonth(nextMonth);
                }}
                containerStyle={{ width: 138 }}
              />
              <WheelPicker
                key={`en-day-${datePickerSessionKey}`}
                items={dayItems}
                initValue={`${draftDay}`}
                itemHeight={44}
                onItemChange={(item) => {
                  const nextDay = getNumericValue(item);
                  if (!Number.isFinite(nextDay)) return;
                  if (nextDay < 1 || nextDay > getDaysInMonth(draftYear, draftMonth))
                    return;
                  setDraftDay(nextDay);
                }}
                containerStyle={{ width: 82 }}
              />
              <WheelPicker
                key={`en-year-${datePickerSessionKey}`}
                items={yearItems}
                initValue={`${draftYear}`}
                itemHeight={44}
                onItemChange={(item) => {
                  const nextYear = getNumericValue(item);
                  if (!Number.isFinite(nextYear)) return;
                  setDraftYear(nextYear);
                }}
                containerStyle={{ width: 112 }}
              />
            </>
          )}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 88,
              height: 44,
              backgroundColor: "#f1f2f5",
              borderRadius: 8,
              zIndex: -1,
            }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={applyTodayAndClose}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ECEFF3",
            }}
          >
            <Text
              style={[fontPreset.semibold, { color: "#596273", fontSize: 18 }]}
            >
              {i18n.t("main.datePicker.today")}
            </Text>
          </Pressable>
          <Pressable
            onPress={applyPickedDateAndClose}
            style={{
              flex: 3,
              height: 48,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#2D3645",
            }}
          >
            <Text
              style={[fontPreset.semibold, { color: "#fff", fontSize: 18 }]}
            >
              {i18n.t("main.datePicker.confirm")}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </>
  );

  if (!authReady || !isLoggedIn) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F9FC" }}>
      {/* 헤더 */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingBottom: 20,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          overflow: "visible",
          // Android elevation은 iOS shadow prop과 다른 알고리즘 → boxShadow로 동일하게
          boxShadow: [
            {
              offsetX: 0,
              offsetY: 3,
              blurRadius: 14,
              color: "rgba(0, 0, 0, 0.06)",
            },
          ],
        }}
      >
        <View style={{ paddingTop: 8, paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center", // 🔥 핵심
                gap: 5,
              }}
            >
              <Text style={[fontPreset.semibold, { fontSize: 22, fontWeight: "600" }]}>
                {formatMonth(calendarDate)}
              </Text>

              <Pressable onPress={openDatePicker} hitSlop={10}>
                <DownIcon
                  width={30} // 🔥 텍스트랑 비율 맞추기
                  height={30}
                  color="#212124"
                />
              </Pressable>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                transform: [{ translateY: -1 }],
              }}
            >
              <Pressable onPress={goToToday}>
                <Text style={headerActionTextStyle}>
                  {i18n.t("main.header.today")}
                </Text>
              </Pressable>

              <Text style={{ marginHorizontal: 8 }}>|</Text>

              <Pressable onPress={openMonthly}>
                <Text style={headerActionTextStyle}>
                  {i18n.t("main.header.monthly")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
        {/* 🔥 주간 스와이프 */}
        <FlatList
          ref={flatListRef}
          data={weeks}
          extraData={weekStripExtraData}
          horizontal
          pagingEnabled
          snapToInterval={width}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={WEEK_STRIP_CENTER_INDEX}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onMomentumScrollEnd={handleScroll}
          renderItem={({ item }) => (
            <View style={{ width }}>
              <View style={{}}>
                {/* 요일 */}
                <View style={{ flexDirection: "row" }}>
                  {weekDays.map((d, index) => {
                    const columnDate = item[index];
                    const isSelectedWeekdayHighlight = isSameDate(columnDate, gratitudeDate);
                    const isTodayWeekdayHighlight = isCalendarToday(columnDate);

                    return (
                      <View
                        key={d}
                        style={{
                          flex: 1,
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            overflow: "hidden",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: isSelectedWeekdayHighlight
                              ? "#2B313D"
                              : isTodayWeekdayHighlight
                                ? "#F2F3F6"
                                : "transparent",
                          }}
                        >
                          <Text
                            style={[
                              fontPreset.medium,
                              {
                                color: isSelectedWeekdayHighlight ? "#FFFFFF" : "#888",
                                fontWeight: isSelectedWeekdayHighlight ? "600" : "500",
                                fontSize: 13,
                                lineHeight: 28,
                                textAlign: "center",
                                backgroundColor: "transparent",
                                includeFontPadding: false,
                                ...(Platform.OS === "android"
                                  ? { textAlignVertical: "center" as const }
                                  : null),
                              },
                            ]}
                          >
                            {d}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* 날짜 */}
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 10,
                  }}
                >
                  {item.map((date: Date, i: number) => {
                    const dateKey = formatDateKey(date);
                    const diaryCount = diaryCountByDate[dateKey] ?? 0;
                    const isFuture = isFutureDate(date);
                    const dateReplyStatus = getDisplayReplyStatusForDate(date, diaryCount);
                    const isDraftReply =
                      !isFuture &&
                      (dateReplyStatus === "HAS_DRAFT" ||
                        dateReplyStatus === "INVALID_DRAFT");
                    const cloverColor = isFuture
                      ? "#D1D5DD"
                      : getDisplayCloverColor(diaryCount, dateReplyStatus);
                    const showReplyUnreadDot =
                      !isFuture && dateReplyStatus === "READY_NOT_READ";

                    return (
                      <View
                        key={i}
                        style={{
                          flex: 1, // 🔥 핵심
                          alignItems: "center",
                        }}
                      >
                        <Pressable
                          onPress={() => selectDateFromWeekRow(date)}
                          disabled={isFuture}
                          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                          android_ripple={
                            Platform.OS === "android" && !isFuture
                              ? { color: "rgba(0, 0, 0, 0.06)", borderless: true, radius: 22 }
                              : undefined
                          }
                          style={{
                            width: 32,
                            height: 32,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <CloverIcon width={28} height={28} color={cloverColor} />
                          {showReplyUnreadDot && (
                            <ReplyUnreadDotIcon
                              width={8}
                              height={8}
                              style={{
                                position: "absolute",
                                right: -2,
                                bottom: 2,
                              }}
                            />
                          )}

                          {isDraftReply ? (
                            <DotDotDotIcon width={12} height={3} style={{ position: "absolute" }} />
                          ) : (
                            <Text
                              style={[
                                fontPreset.semibold,
                                {
                                  position: "absolute",
                                  width: 32,
                                  textAlign: "center",
                                  color: "#fff",
                                  fontSize: 12,
                                  lineHeight: 14,
                                  includeFontPadding: false,
                                  textAlignVertical: "center",
                                },
                              ]}
                            >
                              {date.getDate()}
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        />
      </View>

      {/* 중간 비주얼 영역 */}
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
        <View
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
          }}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setVisualAreaSize((prev) =>
              prev.width === width && prev.height === height ? prev : { width, height },
            );
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
              style={{
                width: "100%",
                aspectRatio: BG_DEFAULT_ASPECT_RATIO,
              }}
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
                style={{ marginBottom: 6 }}
                pointerEvents="none"
              />
              <Pressable
                onPress={() => setShowReward(true)}
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
                  <Text
                    style={{
                      fontSize: 14,
                      lineHeight: 16,
                      includeFontPadding: false,
                    }}
                  >
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
                  style={{ marginLeft: 6, transform: [{ translateY: 1 }] }}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View
          style={{
            width: "100%",
            paddingHorizontal: 20,
            marginTop: GRATITUDE_SLOT_MARGIN_TOP,
            marginBottom: GRATITUDE_ABOVE_TAB_BAR,
            height: GRATITUDE_SLOT_HEIGHT,
          }}
        >
          <View
            style={{
              flex: 1,
              paddingTop: GRATITUDE_SCROLL_PADDING_TOP,
              paddingBottom: 4,
            }}
          >
            {isCalendarToday(gratitudeDate) ? (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: "flex-end",
                }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                bounces={false}
              >
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    paddingHorizontal: 15,
                    paddingTop:15,
                    paddingBottom: 15,
                    overflow: "visible",
                    boxShadow: [
                      {
                        offsetX: 0,
                        offsetY: 1,
                        blurRadius: 6,
                        color: "rgba(0, 0, 0, 0.05)",
                      },
                    ],
                  }}
                >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <PromptIcon width={18} height={18} style={{ marginRight: 6 }} />
                  <Text
                    style={[
                      fontPreset.semibold,
                      { color: "#00A34A", fontSize: 15 },
                    ]}
                  >
                    {i18n.t("main.gratitude.title")}
                  </Text>
                </View>
                <View style={{ width: "100%", marginBottom: 12 }}>
                  <GradientText
                    style={[
                      fontPreset.bold,
                      {
                        fontSize: 16,
                        lineHeight: 16 * 1.4,
                        letterSpacing: 16 * -0.02,
                      },
                    ]}
                  >
                    {journalPromptText ||
                      (isKo ? DUMMY_JOURNAL_PROMPT_KO : DUMMY_JOURNAL_PROMPT_EN)}
                  </GradientText>
                </View>
                <View
                  style={{
                    position: "relative",
                    marginBottom: 14,
                    overflow: "visible",
                  }}
                >
                  <View
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: "#E5E7EB",
                    }}
                  />
                  {isUnready && (
                    <Pressable
                      onPress={() => {}}
                      hitSlop={8}
                      style={{
                        position: "absolute",
                        right: -15,
                        top: -13,
                        overflow: "visible",
                      }}
                    >
                      <AdToReplyIcon width={isKo ? 168 : 160} height={42} />
                    </Pressable>
                  )}
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    minHeight: 34,
                    paddingTop: isUnready ? 0 : 0,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexShrink: 1,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#F3F4F6",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 10,
                      }}
                    >
                      <Text
                        style={[
                          fontPreset.semibold,
                          { color: "#6B7280", fontSize: 12, fontWeight: "600" },
                        ]}
                      >
                        {i18n.t("main.gratitude.todayBadge")}
                      </Text>
                    </View>
                    <Text
                      style={[
                        fontPreset.semibold,
                        {
                          color: "#111827",
                          fontSize: isKo ? 15 : 14,
                          fontWeight: "600",
                          marginLeft: isKo ? 10 : 8,
                          flexShrink: 1,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {pastCardDateLabel}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: isKo ? 8 : 4 }} />
                  {isUnready ? (
                    <Text
                      style={[
                        fontPreset.medium,
                        {
                          color: "#4B5563",
                          fontSize: isKo ? 15 : 13,
                          fontWeight: "500",
                          flexShrink: 0,
                          fontFamily: "PretendardMedium",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedReplyReadyAtMs != null ? timerText : unreadyNoScheduleText}
                    </Text>
                  ) : (
                    <Pressable
                      onPress={() => {}}
                      hitSlop={8}
                      style={{ width: isKo ? 106 : 132, alignItems: "flex-end" }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        {isReadyNotRead && (
                          <NewIcon width={14} height={14} style={{ marginRight: 2 }} />
                        )}
                        <Text
                          style={[
                            fontPreset.semibold,
                            {
                              color: actionTextColor,
                              fontSize: 14,
                              fontWeight: "600",
                              marginLeft: isReadyNotRead ? 4 : 10,
                            },
                          ]}
                        >
                          {actionLabel}
                        </Text>
                        {isReadyNotRead ? (
                          <ChevronGreenIcon
                            width={8}
                            height={12}
                            style={{ marginLeft: 6, transform: [{ translateY: 1 }] }}
                          />
                        ) : (
                          <ChevronDarkIcon
                            width={8}
                            height={12}
                            style={{ marginLeft: 6, transform: [{ translateY: 1 }] }}
                          />
                        )}
                      </View>
                    </Pressable>
                  )}
                </View>
                </View>
              </ScrollView>
            ) : (
              <View style={{ flex: 1, justifyContent: "flex-end" }}>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    paddingHorizontal: 22,
                    paddingVertical: 15,
                    overflow: "visible",
                    boxShadow: [
                      {
                        offsetX: 0,
                        offsetY: 1,
                        blurRadius: 6,
                        color: "rgba(0, 0, 0, 0.05)",
                      },
                    ],
                  }}
                >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    minHeight: 34,
                    paddingTop: isUnready ? 6 : 0,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexShrink: 1,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#F3F4F6",
                        borderRadius: 8,
                        marginLeft: !isKo && diffDaysFromToday >= 2 ? -10 : -10,
                        paddingHorizontal: 10,
                        paddingVertical: 10,
                      }}
                    >
                      <Text
                        style={[
                          fontPreset.semibold,
                          { color: "#6B7280", fontSize: 12, fontWeight: "600" },
                        ]}
                      >
                        {pastDayBadgeLabel}
                      </Text>
                    </View>
                    <Text
                      style={[
                        fontPreset.semibold,
                        {
                          color: "#111827",
                          fontSize: isKo ? 15 : 14,
                          fontWeight: "600",
                          marginLeft: isKo ? 10 : 8,
                          flexShrink: 1,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {pastCardDateLabel}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: isKo ? 8 : 4 }} />
                  {isUnready ? (
                    <Text
                      style={[
                        fontPreset.medium,
                        {
                          color: "#4B5563",
                          fontSize: isKo ? 15 : 13,
                          fontWeight: "500",
                          flexShrink: 0,
                          fontFamily: "PretendardMedium",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedReplyReadyAtMs != null ? timerText : unreadyNoScheduleText}
                    </Text>
                  ) : (
                    <Pressable
                      onPress={() => {}}
                      hitSlop={8}
                      style={{ width: isKo ? 106 : 132, alignItems: "flex-end" }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        {isReadyNotRead && (
                          <NewIcon width={14} height={14} style={{ marginRight: 0}} />
                        )}
                        <Text
                          style={[
                            fontPreset.semibold,
                            {
                              color: actionTextColor,
                              fontSize: 14,
                              fontWeight: "600",
                              marginLeft: isReadyNotRead ? 2 : 0,
                            },
                          ]}
                        >
                          {actionLabel}
                        </Text>
                        {isReadyNotRead ? (
                          <ChevronGreenIcon
                            width={8}
                            height={12}
                            style={{ marginLeft: 6, transform: [{ translateY: 1 }] }}
                          />
                        ) : (
                          <ChevronDarkIcon
                            width={8}
                            height={12}
                            style={{ marginLeft: 6, transform: [{ translateY: 1 }] }}
                          />
                        )}
                      </View>
                    </Pressable>
                  )}
                </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
      {/* 🔥 Monthly Sheet */}
      <Modal
        transparent
        visible={isMonthlyOpen}
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        {/* Blur */}
        <Pressable
          onPress={() => closeMonthly()}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        >
          {Platform.OS === "android" ? (
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }} />
          ) : (
            <BlurView intensity={15} tint="dark" style={{ flex: 1 }} />
          )}

          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: "rgba(0,0,0,0.05)",
            }}
          />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;

            if (h !== sheetHeight) {
              setSheetHeight(h);

              // 🔥 처음 열릴 때만 초기 위치 세팅
              if (!isMonthlyOpen) {
                translateY.setValue(-h);
              }
            }
          }}
          style={{
            position: "absolute",
            top: 0,
            width: "100%",
            backgroundColor: "#fff",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            paddingTop: 40,
            paddingBottom: 6,
            overflow: "hidden",
            transform: [{ translateY }],
          }}
        >
          {/* 🔥 단 하나의 기준 */}
          <View style={{ paddingHorizontal: 5, paddingTop: 20 }}>
            {/* 헤더 */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center", // 👈 이거 추가
                marginBottom: 15,
                paddingHorizontal: 15,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={[fontPreset.semibold, { fontSize: 22, fontWeight: "600" }]}>
                  {formatMonth(calendarDate)}
                </Text>

                <Pressable onPress={openDatePicker} hitSlop={10}>
                  <DownIcon
                    width={30}
                    height={30}
                    color="#324c3d"
                    style={{ marginLeft: 4 }}
                  />
                </Pressable>
              </View>
              <Text style={[fontPreset.medium, { color: "#666" }]}>
                {i18n.t("main.header.weekly")}
              </Text>
            </View>

            {/* 요일 */}
            <View style={{ flexDirection: "row", marginBottom: 28 }}>
              {weekDays.map((d, index) => {
                const isSelectedWeekday = index === selectedWeekdayIndex;
                const todayWeekdayIndex = (today.getDay() + 6) % 7;
                const isTodayWeekday = index === todayWeekdayIndex;
                return (
                  <View
                    key={d}
                    style={{
                      flex: 1,
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: !isKo ? 28 : 28,
                        height: !isKo ? 28 : 28,
                        borderRadius: 14,
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                        backgroundColor: isSelectedWeekday
                          ? "#2B313D"
                          : isTodayWeekday
                            ? "#F2F3F6"
                            : "transparent",
                      }}
                    >
                      <Text
                        style={[
                          fontPreset.medium,
                          {
                            color: isSelectedWeekday ? "#FFFFFF" : "#888",
                            fontWeight: isSelectedWeekday ? "600" : "500",
                            fontSize: 13, // 🔥 글자도 같이 줄여줘야 균형 맞음
                          },
                        ]}
                      >
                        {d}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 🔥 날짜 grid (같은 컨테이너 안!) */}
            {getMonthMatrix(calendarDate)
              .filter((week) =>
                week.some((date) => date.getMonth() === calendarDate.getMonth()),
              )
              .map((week, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  marginBottom: 18,
                }}
              >
                {week.map((date, j) => {
                  const isToday = isSameDate(date, today);
                  const isCurrentMonth =
                    date.getMonth() === calendarDate.getMonth();
                  const isFuture = isFutureDate(date);
                  const dateKey = formatDateKey(date);
                  const diaryCount = diaryCountByDate[dateKey] ?? 0;
                  const dateReplyStatus = getDisplayReplyStatusForDate(date, diaryCount);
                  const isDraftReply =
                    !isFuture &&
                    (dateReplyStatus === "HAS_DRAFT" ||
                      dateReplyStatus === "INVALID_DRAFT");
                  const showReplyUnreadDot = !isFuture && dateReplyStatus === "READY_NOT_READ";
                  const cloverColor = isFuture
                    ? "#D1D5DD"
                    : getDisplayCloverColor(diaryCount, dateReplyStatus);

                  return (
                    <View
                      key={j}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        minHeight: 40,
                        justifyContent: "flex-start",
                      }}
                    >
                      {!isCurrentMonth ? (
                        <View style={{ width: 32, height: 32 }} />
                      ) : (
                        <Pressable
                          onPress={() => {
                            if (isFuture) return;
                            selectDateFromWeekRow(date);
                            closeMonthly();
                          }}
                          disabled={isFuture}
                          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                          android_ripple={
                            Platform.OS === "android" && !isFuture
                              ? { color: "rgba(0, 0, 0, 0.06)", borderless: true, radius: 22 }
                              : undefined
                          }
                          style={{
                            width: 32,
                            height: 32,
                            justifyContent: "center",
                            alignItems: "center",
                            position: "relative",
                          }}
                        >
                          {/* Today */}
                          {isToday && (
                            <TodayIcon
                              width={isKo ? 35 : 40}
                              height={isKo ? 38 : 44}
                              style={{
                                position: "absolute",
                                top: isKo ? -29 : -34,
                              }}
                            />
                          )}

                          {/* 🔥 Clover (24로 줄이기 + 중앙 고정) */}
                          <CloverIcon
                            width={28}
                            height={28}
                            color={cloverColor}
                            style={{
                              position: "absolute",
                            }}
                          />
                          {showReplyUnreadDot && (
                            <ReplyUnreadDotIcon
                              width={8}
                              height={8}
                              style={{
                                position: "absolute",
                                right: -2,
                                bottom: 2,
                              }}
                            />
                          )}

                          {/* 🔥 텍스트 중앙 */}
                          {isDraftReply ? (
                            <DotDotDotIcon width={12} height={3} style={{ position: "absolute" }} />
                          ) : (
                            <Text
                              style={[
                                fontPreset.semibold,
                                {
                                position: "absolute",
                                width: 32,
                                textAlign: "center",
                                color: "#fff",
                                fontSize: 12,
                                lineHeight: 14,
                                includeFontPadding: false,
                                textAlignVertical: "center",
                              },
                              ]}
                            >
                              {date.getDate()}
                            </Text>
                          )}
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
          <Pressable
            onPress={() => closeMonthly()}
            hitSlop={{ top: 40, bottom: 40, left: 20, right: 20 }}
            style={{
              position: "absolute",
              bottom: 8,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
            {...panResponder.panHandlers}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#D1D5DB",
              }}
            />
          </Pressable>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 2,
              backgroundColor: "#FFFFFF",
            }}
          />
        </Animated.View>
        {isDatePickerOpen && renderDatePickerLayer()}
      </Modal>
      <Modal
        transparent
        visible={isDatePickerOpen && !isMonthlyOpen}
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        {renderDatePickerLayer()}
      </Modal>
      <CloverRewardBottomSheet
        visible={showReward}
        onClose={() => setShowReward(false)}
      />
    </View>
  );
}
