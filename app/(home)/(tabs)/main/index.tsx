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
  ImageBackground,
  Modal,
  PanResponder,
  Easing,
} from "react-native";
import { Image } from "react-native";
import { BlurView } from "expo-blur";
import { AuthContext } from "../../../_layout";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { getDeviceTimeZone } from "@/shared/utils/timezone";
import authService from "@/services/authService";
import i18n from "@/app/i18n/i18n";
import CloverIcon from "@/assets/icons/ic_clover.svg";
import DownIcon from "@/assets/icons/ic_down.svg";
import TodayIcon from "@/assets/icons/weekday-item.svg";
import WheelPicker from "@/components/WheelPicker";
const { width } = Dimensions.get("window");

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

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
  if (count <= 0) return "#D1D5DB";
  if (count === 1) return "#8EF3B9";
  if (count === 2) return "#46DD8A";
  return "#00D15A";
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

  // 테스트용: 응답이 비어있거나 모두 0이면 해당 월을 1~4 랜덤으로 채움
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    diaryCountMap[dateKey] = Math.floor(Math.random() * 4) + 1;
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
      ) => {
        const diaryCountMap = buildDiaryCountMap(diaries, year, month);
        setDiaryCountByDate((prev) => ({ ...prev, ...diaryCountMap }));
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
          mergeMonthDiaryCount(diaries, year, month);
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
  const [draftYear, setDraftYear] = useState(currentDate.getFullYear());
  const [draftMonth, setDraftMonth] = useState(currentDate.getMonth() + 1);
  const [draftDay, setDraftDay] = useState(currentDate.getDate());
  const [sheetHeight, setSheetHeight] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const datePickerTranslateY = useRef(new Animated.Value(420)).current;
  const isKo = i18n.locale?.startsWith("ko");

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
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
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
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {/* 헤더 */}
      <View
        style={{
          backgroundColor: "#baafaf",
          paddingBottom: 20,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,

          // iOS shadow
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 6,

          // Android shadow
          elevation: 5,
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
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "600",
                }}
              >
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
                <Text style={{ fontWeight: "400" }}>
                  {i18n.t("main.header.today")}
                </Text>
              </Pressable>

              <Text style={{ marginHorizontal: 8 }}>|</Text>

              <Pressable onPress={openMonthly}>
                <Text style={{ fontWeight: "400" }}>
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
                  {WEEK_DAYS.map((d, index) => {
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
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: isToday
                              ? "#E5E7EB"
                              : "transparent",
                          }}
                        >
                          <Text
                            style={{
                              color: "#888",
                              fontWeight: isToday ? "600" : "400",
                              fontSize: 13,
                            }}
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
                            style={{
                              position: "absolute",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: "600",
                            }}
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

      {/* 빈 영역 */}
      <View style={{ flex: 1 }} />
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
            paddingBottom: 15,
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
                <Text style={{ fontSize: 22, fontWeight: "600" }}>
                  {formatMonth(currentDate)}
                </Text>

                <DownIcon
                  width={30}
                  height={30}
                  color="#324c3d"
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={{ color: "#666" }}>{i18n.t("main.header.weekly")}</Text>
            </View>

            {/* 요일 */}
            <View style={{ flexDirection: "row", marginBottom: 15 }}>
              {WEEK_DAYS.map((d, index) => {
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
                        width: 24, // 🔥 줄임
                        height: 24, // 🔥 줄임
                        borderRadius: 12, // 🔥 항상 절반
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: isToday ? "#E5E7EB" : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          color: "#888",
                          fontWeight: isToday ? "600" : "400",
                          fontSize: 13, // 🔥 글자도 같이 줄여줘야 균형 맞음
                        }}
                      >
                        {d}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 🔥 날짜 grid (같은 컨테이너 안!) */}
            {getMonthMatrix(currentDate).map((week, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  marginBottom: 20,
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
                              width={35}
                              height={38}
                              style={{
                                position: "absolute",
                                top: -29,
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
                            style={{
                              position: "absolute",
                              textAlign: "center",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: "600",
                              lineHeight: 32, // 🔥 세로 중앙 핵심
                            }}
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
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: "#20232a",
              marginBottom: 18,
            }}
          >
            {i18n.t("main.datePicker.title")}
          </Text>
          <View
            style={{
              height: 220,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {isKo ? (
              <>
                <WheelPicker
                  items={yearItems}
                  initValue={`${draftYear}년`}
                  itemHeight={44}
                  onItemChange={(item) => {
                    const nextYear = getNumericValue(item);
                    if (!Number.isFinite(nextYear)) return;
                    setDraftYear(nextYear);
                  }}
                  containerStyle={{ flex: 1 }}
                />
                <WheelPicker
                  items={monthItems}
                  initValue={`${draftMonth}월`}
                  itemHeight={44}
                  onItemChange={(item) => {
                    const nextMonth = getNumericValue(item);
                    if (!Number.isFinite(nextMonth)) return;
                    if (nextMonth < 1 || nextMonth > 12) return;
                    setDraftMonth(nextMonth);
                  }}
                  containerStyle={{ flex: 1 }}
                />
                <WheelPicker
                  items={dayItems}
                  initValue={`${draftDay}일`}
                  itemHeight={44}
                  onItemChange={(item) => {
                    const nextDay = getNumericValue(item);
                    if (!Number.isFinite(nextDay)) return;
                    if (nextDay < 1 || nextDay > getDaysInMonth(draftYear, draftMonth))
                      return;
                    setDraftDay(nextDay);
                  }}
                  containerStyle={{ flex: 1 }}
                />
              </>
            ) : (
              <>
                <WheelPicker
                  items={monthItems}
                  initValue={monthItems[draftMonth - 1]}
                  itemHeight={44}
                  onItemChange={(item) => {
                    const nextMonth = monthItems.indexOf(item) + 1;
                    if (!Number.isFinite(nextMonth)) return;
                    if (nextMonth < 1 || nextMonth > 12) return;
                    setDraftMonth(nextMonth);
                  }}
                  containerStyle={{ flex: 1 }}
                />
                <WheelPicker
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
                  containerStyle={{ flex: 1 }}
                />
                <WheelPicker
                  items={yearItems}
                  initValue={`${draftYear}`}
                  itemHeight={44}
                  onItemChange={(item) => {
                    const nextYear = getNumericValue(item);
                    if (!Number.isFinite(nextYear)) return;
                    setDraftYear(nextYear);
                  }}
                  containerStyle={{ flex: 1 }}
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
              <Text style={{ color: "#596273", fontSize: 18, fontWeight: "600" }}>
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
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                {i18n.t("main.datePicker.confirm")}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}
