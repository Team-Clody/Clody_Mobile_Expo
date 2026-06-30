import { ComponentType } from "react";
import {
  Animated,
  GestureResponderHandlers,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import CloverIcon from "@/assets/icons/ic_clover.svg";
import DownIcon from "@/assets/icons/ic_down.svg";
import ReplyUnreadDotIcon from "@/assets/Ellipse2636.svg";
import i18n from "@/app/i18n/i18n";
import { CloverDayOverlay } from "./CloverDayOverlay";
import {
  MONTHLY_SHEET_CLOVER_ROW_GAP,
  MONTHLY_TODAY_BADGE_BG,
  MONTHLY_TODAY_BADGE_SIZE,
  TODAY_WEEKDAY_LABEL_CIRCLE_SIZE,
  WEEKDAY_LABEL_CIRCLE_SIZE,
} from "../_constants";
import { fontPreset } from "@/shared/theme/localeTypography";
import type { ReplyStatus } from "../_types";
import { getMonthMatrix } from "../_utils/calendarDataUtils";
import {
  formatDateKey,
  formatMonth,
  isFutureDate,
  isSameDate,
} from "../_utils/dateUtils";
import { getDisplayCloverColor, isDraftReplyStatus } from "../_utils/cloverUtils";

type TodayIconProps = {
  width?: number;
  height?: number;
  color?: string;
  style?: object;
};

type MonthlyCalendarSheetProps = {
  translateY: Animated.Value;
  sheetHeight: number;
  calendarDate: Date;
  today: Date;
  gratitudeDate: Date;
  weekDays: string[];
  isKo: boolean;
  TodayIcon: ComponentType<TodayIconProps>;
  diaryCountByDate: Record<string, number>;
  panHandlers: GestureResponderHandlers;
  datePickerLayer: React.ReactNode;
  isDatePickerOpen: boolean;
  getDisplayReplyStatusForDate: (date: Date, diaryCount: number) => ReplyStatus;
  onClose: () => void;
  onOpenDatePicker: () => void;
  onSelectDate: (date: Date) => void;
  onSheetLayout: (height: number) => void;
};

export function MonthlyCalendarSheet({
  translateY,
  sheetHeight,
  calendarDate,
  today,
  gratitudeDate,
  weekDays,
  isKo,
  TodayIcon,
  diaryCountByDate,
  panHandlers,
  datePickerLayer,
  isDatePickerOpen,
  getDisplayReplyStatusForDate,
  onClose,
  onOpenDatePicker,
  onSelectDate,
  onSheetLayout,
}: MonthlyCalendarSheetProps) {
  const selectedWeekdayIndex = (gratitudeDate.getDay() + 6) % 7;
  const todayWeekdayIndex = (today.getDay() + 6) % 7;

  return (
    <>
      <Pressable
        onPress={onClose}
        style={{ position: "absolute", width: "100%", height: "100%" }}
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

      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h !== sheetHeight) {
            onSheetLayout(h);
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
        <View style={{ paddingHorizontal: 5, paddingTop: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
              paddingHorizontal: 15,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[fontPreset.semibold, { fontSize: 22, fontWeight: "600" }]}>
                {formatMonth(calendarDate)}
              </Text>
              <Pressable onPress={onOpenDatePicker} hitSlop={10}>
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

          <View style={{ flexDirection: "row", marginBottom: 28 }}>
            {weekDays.map((d, index) => {
              const isSelectedWeekday = index === selectedWeekdayIndex;
              const isTodayWeekday = index === todayWeekdayIndex;
              const weekdayCircleSize = isTodayWeekday
                ? TODAY_WEEKDAY_LABEL_CIRCLE_SIZE
                : WEEKDAY_LABEL_CIRCLE_SIZE;
              return (
                <View key={d} style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={{
                      width: weekdayCircleSize,
                      height: weekdayCircleSize,
                      borderRadius: weekdayCircleSize / 2,
                      justifyContent: "center",
                      alignItems: "center",
                      overflow: "hidden",
                      backgroundColor: isSelectedWeekday
                        ? "#293038"
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

          {getMonthMatrix(calendarDate)
            .filter((week) =>
              week.some((date) => date.getMonth() === calendarDate.getMonth()),
            )
            .map((week, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  marginBottom: MONTHLY_SHEET_CLOVER_ROW_GAP,
                }}
              >
                {week.map((date, j) => {
                  const isToday = isSameDate(date, today);
                  const isCurrentMonth = date.getMonth() === calendarDate.getMonth();
                  const isFuture = isFutureDate(date);
                  const dateKey = formatDateKey(date);
                  const diaryCount = diaryCountByDate[dateKey] ?? 0;
                  const dateReplyStatus = getDisplayReplyStatusForDate(date, diaryCount);
                  const isDraftReply =
                    !isFuture && isDraftReplyStatus(dateReplyStatus);
                  const showReplyUnreadDot =
                    !isFuture && dateReplyStatus === "READY_NOT_READ";
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
                            onSelectDate(date);
                            onClose();
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
                          {isToday && (
                            <TodayIcon
                              width={
                                isKo
                                  ? MONTHLY_TODAY_BADGE_SIZE.ko.width
                                  : MONTHLY_TODAY_BADGE_SIZE.en.width
                              }
                              height={
                                isKo
                                  ? MONTHLY_TODAY_BADGE_SIZE.ko.height
                                  : MONTHLY_TODAY_BADGE_SIZE.en.height
                              }
                              color={MONTHLY_TODAY_BADGE_BG}
                              style={{
                                position: "absolute",
                                top: isKo
                                  ? MONTHLY_TODAY_BADGE_SIZE.ko.top
                                  : MONTHLY_TODAY_BADGE_SIZE.en.top,
                              }}
                            />
                          )}
                          <CloverIcon
                            width={28}
                            height={28}
                            color={cloverColor}
                            style={{ position: "absolute" }}
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
                          <CloverDayOverlay
                            isDraft={isDraftReply}
                            dayNumber={date.getDate()}
                          />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={{ top: 40, bottom: 40, left: 20, right: 20 }}
          style={{
            position: "absolute",
            bottom: 8,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
          {...panHandlers}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#E3E6ED",
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
      {isDatePickerOpen ? datePickerLayer : null}
    </>
  );
}
