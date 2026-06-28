import { RefObject } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import CloverIcon from "@/assets/icons/ic_clover.svg";
import ReplyUnreadDotIcon from "@/assets/Ellipse2636.svg";
import DotDotDotIcon from "@/assets/icons/dotdotdot.svg";
import {
  cloverDateTextStyle,
  fontPreset,
  SCREEN_WIDTH,
  TODAY_WEEKDAY_LABEL_CIRCLE_SIZE,
  WEEKDAY_LABEL_CIRCLE_SIZE,
  WEEK_STRIP_CENTER_INDEX,
} from "../constants";
import type { ReplyStatus } from "../types";
import {
  formatDateKey,
  isCalendarToday,
  isFutureDate,
  isSameDate,
} from "../utils/dateUtils";
import { getDisplayCloverColor } from "../utils/cloverUtils";

type WeeklyCalendarStripProps = {
  flatListRef: RefObject<FlatList<Date[]> | null>;
  weeks: Date[][];
  weekDays: string[];
  gratitudeDate: Date;
  diaryCountByDate: Record<string, number>;
  weekStripExtraData: object;
  getDisplayReplyStatusForDate: (date: Date, diaryCount: number) => ReplyStatus;
  onSelectDate: (date: Date) => void;
  onScrollEnd: (event: { nativeEvent: { contentOffset: { x: number } } }) => void;
};

export function WeeklyCalendarStrip({
  flatListRef,
  weeks,
  weekDays,
  gratitudeDate,
  diaryCountByDate,
  weekStripExtraData,
  getDisplayReplyStatusForDate,
  onSelectDate,
  onScrollEnd,
}: WeeklyCalendarStripProps) {
  return (
    <FlatList
      ref={flatListRef}
      data={weeks}
      extraData={weekStripExtraData}
      horizontal
      pagingEnabled
      snapToInterval={SCREEN_WIDTH}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={WEEK_STRIP_CENTER_INDEX}
      getItemLayout={(_, index) => ({
        length: SCREEN_WIDTH,
        offset: SCREEN_WIDTH * index,
        index,
      })}
      onMomentumScrollEnd={onScrollEnd}
      renderItem={({ item }) => (
        <View style={{ width: SCREEN_WIDTH }}>
          <View style={{ flexDirection: "row" }}>
            {weekDays.map((d, index) => {
              const columnDate = item[index];
              const isSelectedWeekdayHighlight = isSameDate(columnDate, gratitudeDate);
              const isTodayWeekdayHighlight = isCalendarToday(columnDate);
              const weekdayCircleSize = isTodayWeekdayHighlight
                ? TODAY_WEEKDAY_LABEL_CIRCLE_SIZE
                : WEEKDAY_LABEL_CIRCLE_SIZE;

              return (
                <View key={d} style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={{
                      width: weekdayCircleSize,
                      height: weekdayCircleSize,
                      borderRadius: 999,
                      overflow: "hidden",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: isSelectedWeekdayHighlight
                        ? "#293038"
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
                          lineHeight: weekdayCircleSize,
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

          <View style={{ flexDirection: "row", marginTop: 6 }}>
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
                <View key={i} style={{ flex: 1, alignItems: "center" }}>
                  <Pressable
                    onPress={() => onSelectDate(date)}
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
                        style={{ position: "absolute", right: -2, bottom: 2 }}
                      />
                    )}
                    {isDraftReply ? (
                      <DotDotDotIcon width={12} height={3} style={{ position: "absolute" }} />
                    ) : (
                      <Text style={cloverDateTextStyle}>{date.getDate()}</Text>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      )}
    />
  );
}
