import { useRouter } from "expo-router";
import { useContext, useRef, useState } from "react";
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
import CloverIcon from "@/assets/icons/ic_clover.svg";
import DownIcon from "@/assets/icons/ic_down.svg";
import TodayIcon from "@/assets/icons/weekday-item.svg";
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
  return date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const isSameDate = (a: Date, b: Date) => {
  return a.toDateString() === b.toDateString();
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

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);

  // 🔥 Monthly 상태
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;

  const CENTER_INDEX = 50;

  const weeks = Array.from({ length: 100 }, (_, i) => {
    const start = getStartOfWeek(addDays(today, (i - CENTER_INDEX) * 7));
    return Array.from({ length: 7 }, (_, j) => addDays(start, j));
  });

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);

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
  const todayIndex = (today.getDay() + 6) % 7;
  const lastOffset = useRef(0);
  const OVERDRAG = 100;
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
        let newY = lastOffset.current + gestureState.dy;

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

        // 🔥 위로 스와이프 → 닫기
        if (velocity < -0.5 || distance < -25) {
          closeMonthly();
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

              <DownIcon
                width={30} // 🔥 텍스트랑 비율 맞추기
                height={30}
                color="#324c3d"
              />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Pressable onPress={goToToday}>
                <Text style={{ fontWeight: "400" }}>Today</Text>
              </Pressable>

              <Text style={{ marginHorizontal: 8 }}>|</Text>

              <Pressable onPress={openMonthly}>
                <Text style={{ fontWeight: "400" }}>Monthly</Text>
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
                    const todayIndexInWeek = item.findIndex((date) =>
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
                  {item.map((date, i) => {
                    const isToday = isSameDate(date, today);

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
                          <CloverIcon width={28} height={28} />

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
              <Text style={{ color: "#666" }}>Weekly</Text>
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
    </View>
  );
}
