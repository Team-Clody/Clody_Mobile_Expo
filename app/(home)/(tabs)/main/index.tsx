import { useRouter } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  FlatList,
  Dimensions,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
  Modal,
  PanResponder,
  Easing,
} from "react-native";
import { BlurView } from "expo-blur";
import { AuthContext } from "../../../_layout";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { getDeviceTimeZone } from "@/shared/utils/timezone";
import authService from "@/services/authService";
import i18n from "@/app/i18n/i18n";
import CloverIcon from "@/assets/icons/ic_clover.svg";
import DownIcon from "@/assets/icons/ic_down.svg";
import TodayIconKo from "@/assets/icons/weekday-item_ko.svg";
import TodayIconEn from "@/assets/icons/weekday-item_en.svg";
import WheelPicker from "@/components/WheelPicker";
import GroupCharacter from "@/assets/images/Group.svg";
import BgDefault from "@/assets/images/bg_default.svg";
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

type CalendarDiary = {
  diaryCount: number;
  date: string;
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

const buildDiaryCountMap = (
  diaries: CalendarDiary[],
  year: number,
  month: number,
) => {
  const diaryCountMap = diaries.reduce<Record<string, number>>((acc, diaryItem) => {
    acc[diaryItem.date] = diaryItem.diaryCount ?? 0;
    return acc;
  }, {});

  const hasNonZeroDiaryCount = Object.values(diaryCountMap).some((count) => count > 0);
  if (hasNonZeroDiaryCount) return diaryCountMap;

  // 테스트용: 응답이 비어있거나 모두 0이면 0개 날짜가 반드시 포함되게 생성
  const daysInMonth = new Date(year, month, 0).getDate();
  const zeroDaysTarget = Math.max(5, Math.floor(daysInMonth * 0.25));

  const zeroDaySet = new Set<number>();
  while (zeroDaySet.size < zeroDaysTarget) {
    zeroDaySet.add(Math.floor(Math.random() * daysInMonth) + 1);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (zeroDaySet.has(day)) {
      diaryCountMap[dateKey] = 0;
      continue;
    }

    diaryCountMap[dateKey] = Math.floor(Math.random() * 5) + 1;
  }

  return diaryCountMap;
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
  const { logout } = useContext(AuthContext);
  const router = useRouter();

  const flatListRef = useRef<FlatList>(null);
  const pendingPickedDateRef = useRef<Date | null>(null);

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [diaryCountByDate, setDiaryCountByDate] = useState<
    Record<string, number>
  >({});
  const [totalCloverCount, setTotalCloverCount] = useState(0);
  const fetchedMonthKeysRef = useRef<Set<string>>(new Set());
  const fetchingMonthKeysRef = useRef<Set<string>>(new Set());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  useEffect(() => {
    console.log("[TEST] currentDate:", currentDate);
  }, [currentDate]);
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
      const mergeMonthDiaryCount = (
        diaries: CalendarDiary[],
        year: number,
        month: number,
        totalClover: number,
      ) => {
        const diaryCountMap = buildDiaryCountMap(diaries, year, month);
        setDiaryCountByDate((prev) => ({ ...prev, ...diaryCountMap }));
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
          const diaries = (resp.data?.data?.diaries ?? []) as CalendarDiary[];
          const totalClover = Number(resp.data?.data?.totalCloverCount ?? 0);
          mergeMonthDiaryCount(diaries, year, month, totalClover);
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

  // 🔥 Monthly 상태
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [datePickerSessionKey, setDatePickerSessionKey] = useState(0);
  const [draftYear, setDraftYear] = useState(currentDate.getFullYear());
  const [draftMonth, setDraftMonth] = useState(currentDate.getMonth() + 1);
  const [draftDay, setDraftDay] = useState(currentDate.getDate());
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
  const cloversPerLevel = 2;
  const currentLevel = Math.floor(totalCloverCount / cloversPerLevel) + 1;
  const currentLevelProgress = totalCloverCount % cloversPerLevel;

  const CENTER_INDEX = 50;

  const weeks = Array.from({ length: 100 }, (_, i) => {
    const start = getStartOfWeek(addDays(today, (i - CENTER_INDEX) * 7));
    return Array.from({ length: 7 }, (_, j) => addDays(start, j));
  });

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);

    // DatePicker에서 선택 직후 발생하는 스크롤 이벤트는 선택값을 우선 유지
    if (pendingPickedDateRef.current) {
      setCurrentDate(pendingPickedDateRef.current);
      pendingPickedDateRef.current = null;
      return;
    }

    const week = weeks[index];
    if (!week) return;

    setCurrentDate(week[3]);
  };

  const goToToday = () => {
    flatListRef.current?.scrollToIndex({
      index: CENTER_INDEX,
      animated: true,
    });
    setCurrentDate(today);
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
    setDraftYear(currentDate.getFullYear());
    setDraftMonth(currentDate.getMonth() + 1);
    setDraftDay(currentDate.getDate());
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
  const closeDatePicker = () => {
    Animated.timing(datePickerTranslateY, {
      toValue: 420,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setIsDatePickerOpen(false));
  };
  const applyTodayAndClose = () => {
    const now = new Date();
    setDraftYear(now.getFullYear());
    setDraftMonth(now.getMonth() + 1);
    setDraftDay(now.getDate());
  };
  const applyPickedDateAndClose = () => {
    const safeDay = Math.min(draftDay, getDaysInMonth(draftYear, draftMonth));
    const pickedDate = new Date(draftYear, draftMonth - 1, safeDay);
    const pickedWeekStart = getStartOfWeek(pickedDate);
    const todayWeekStart = getStartOfWeek(today);
    const diffMs = pickedWeekStart.getTime() - todayWeekStart.getTime();
    const diffWeeks = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));
    const rawTargetIndex = CENTER_INDEX + diffWeeks;
    const canScrollToTarget =
      rawTargetIndex >= 0 && rawTargetIndex <= weeks.length - 1;

    if (canScrollToTarget) {
      pendingPickedDateRef.current = pickedDate;
      flatListRef.current?.scrollToIndex({
        index: rawTargetIndex,
        animated: true,
      });
    }
    setCurrentDate(pickedDate);
    closeDatePicker();
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
  const yearItems = Array.from(
    { length: 2100 - 1900 + 1 },
    (_, i) => (isKo ? `${1900 + i}년` : `${1900 + i}`),
  );
  const monthItems = isKo
    ? Array.from({ length: 12 }, (_, i) => `${i + 1}월`)
    : enMonthItems;
  const dayItems = Array.from(
    { length: getDaysInMonth(draftYear, draftMonth) },
    (_, i) => (isKo ? `${i + 1}일` : `${i + 1}`),
  );
  useEffect(() => {
    const maxDay = getDaysInMonth(draftYear, draftMonth);
    if (draftDay > maxDay) {
      setDraftDay(maxDay);
    }
  }, [draftYear, draftMonth, draftDay]);
  const todayIndex = (today.getDay() + 6) % 7;
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

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F9FC" }}>
      {/* 헤더 */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          paddingBottom: 20,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          borderWidth: 0.5,
          borderColor: "#E3E6ED",
          // 은은한 회색 그라데이션 느낌
          shadowColor: "#AEB4C0",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius:24,
          elevation: 2,
        }}
      >
        <View style={{ paddingTop: 60, paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            ✅ 깔끔하게 맞추는 방법
            <View
              style={{
                flexDirection: "row",
                alignItems: "center", // 🔥 핵심
                gap: 5,
              }}
            >
              <Text style={[fontPreset.semibold, { fontSize: 22, fontWeight: "600" }]}>
                {formatMonth(currentDate)}
              </Text>

              <Pressable onPress={openDatePicker} hitSlop={10}>
                <DownIcon
                  width={30} // 🔥 텍스트랑 비율 맞추기
                  height={30}
                  color="#324c3d"
                />
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
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
          horizontal
          pagingEnabled
          snapToInterval={width}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={CENTER_INDEX}
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
                    const todayIndexInWeek = item.findIndex((date: Date) =>
                      isSameDate(date, today),
                    );

                    const isToday = index === todayIndexInWeek;

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
                            borderRadius: 14,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: isToday
                              ? "#2B313D"
                              : "transparent",
                          }}
                        >
                          <Text
                            style={[
                              fontPreset.medium,
                              {
                                color: isToday ? "#FFFFFF" : "#888",
                                fontWeight: isToday ? "600" : "500",
                                fontSize: 13,
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
                    const isToday = isSameDate(date, today);
                    const dateKey = formatDateKey(date);
                    const diaryCount = diaryCountByDate[dateKey] ?? 0;
                    const cloverColor = getCloverColorByCount(diaryCount);

                    return (
                      <View
                        key={i}
                        style={{
                          flex: 1, // 🔥 핵심
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <CloverIcon width={28} height={28} color={cloverColor} />

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
                        </View>
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
          justifyContent: "flex-end",
          paddingBottom: Platform.OS === "android" ? 250 : 205,
          backgroundColor: "#F8F9FC",
          overflow: "hidden",
        }}
      >
        <BgDefault
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          style={StyleSheet.absoluteFillObject}
        />
        <View
          style={{
            width: "100%",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <GroupCharacter width={128} height={183} style={{ marginBottom: 6 }} />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(241, 245, 249, 0.92)",
              borderRadius: 999,
              paddingVertical: 6,
              paddingHorizontal: 10,
              marginBottom: 18,
            }}
          >
            <View
              style={{
                backgroundColor: "#E5E7EB",
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 3,
                marginRight: 6,
              }}
            >
              <Text
                style={[...levelChipTextStyle, { color: "#374151", fontSize: 14 }]}
              >
                {isKo ? `${currentLevel}단계` : `Lv.${currentLevel}`}
              </Text>
            </View>
            <Text
              style={[...cloverCountTextStyle, { color: "#1F2937", fontSize: 16 }]}
            >
              {currentLevelProgress} / {cloversPerLevel}{" "}
              {isKo
                ? "클로버"
                : currentLevelProgress === 1
                  ? "Clover"
                  : "Clovers"}
            </Text>
            <Text style={{ color: "#6B7280", fontSize: 18, marginLeft: 6 }}>›</Text>
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
          onPress={closeMonthly}
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
                  {formatMonth(currentDate)}
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
                const isCurrentMonth =
                  currentDate.getMonth() === today.getMonth() &&
                  currentDate.getFullYear() === today.getFullYear();

                const isToday = isCurrentMonth && index === todayIndex;
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
                        borderRadius: 14,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: isToday ? "#2B313D" : "transparent",
                      }}
                    >
                      <Text
                        style={[
                          fontPreset.medium,
                          {
                            color: isToday ? "#FFFFFF" : "#888",
                            fontWeight: isToday ? "600" : "500",
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
            {getMonthMatrix(currentDate)
              .filter((week) =>
                week.some((date) => date.getMonth() === currentDate.getMonth()),
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
                    date.getMonth() === currentDate.getMonth();
                  const dateKey = formatDateKey(date);
                  const diaryCount = diaryCountByDate[dateKey] ?? 0;
                  const cloverColor = getCloverColorByCount(diaryCount);

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
                        <View
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

                          {/* 🔥 텍스트 중앙 */}
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
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
          <Pressable
            onPress={closeMonthly}
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
      </Modal>
      <Modal
        transparent
        visible={isDatePickerOpen}
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
      >
        <Pressable
          onPress={closeDatePicker}
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
      </Modal>
    </View>
  );
}
