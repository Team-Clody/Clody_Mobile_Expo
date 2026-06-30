import { RefObject } from "react";
import { FlatList, Pressable, Text, TextStyle, View } from "react-native";
import DownIcon from "@/assets/icons/ic_down.svg";
import i18n from "@/app/i18n/i18n";
import { HEADER_ACTION_DIVIDER_COLOR } from "../_constants";
import { fontPreset } from "@/shared/theme/localeTypography";
import { formatMonth } from "../_utils/dateUtils";
import type { ReplyStatus } from "../_types";
import { WeeklyCalendarStrip } from "./WeeklyCalendarStrip";

type MainHeaderProps = {
  calendarDate: Date;
  gratitudeDate: Date;
  weekDays: string[];
  weeks: Date[][];
  flatListRef: RefObject<FlatList<Date[]> | null>;
  weekStripExtraData: object;
  diaryCountByDate: Record<string, number>;
  headerActionTextStyle: TextStyle[];
  getDisplayReplyStatusForDate: (date: Date, diaryCount: number) => ReplyStatus;
  onOpenDatePicker: () => void;
  onGoToToday: () => void;
  onOpenMonthly: () => void;
  onSelectDate: (date: Date) => void;
  onWeekScrollEnd: (event: { nativeEvent: { contentOffset: { x: number } } }) => void;
};

export function MainHeader({
  calendarDate,
  gratitudeDate,
  weekDays,
  weeks,
  flatListRef,
  weekStripExtraData,
  diaryCountByDate,
  headerActionTextStyle,
  getDisplayReplyStatusForDate,
  onOpenDatePicker,
  onGoToToday,
  onOpenMonthly,
  onSelectDate,
  onWeekScrollEnd,
}: MainHeaderProps) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        paddingBottom: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: "visible",
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={[fontPreset.semibold, { fontSize: 22, fontWeight: "600" }]}>
              {formatMonth(calendarDate)}
            </Text>
            <Pressable onPress={onOpenDatePicker} hitSlop={10}>
              <DownIcon width={30} height={30} color="#212124" />
            </Pressable>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              transform: [{ translateY: -1 }],
            }}
          >
            <Pressable onPress={onGoToToday}>
              <Text style={headerActionTextStyle}>
                {i18n.t("main.header.today")}
              </Text>
            </Pressable>
            <Text style={{ marginHorizontal: 8, color: HEADER_ACTION_DIVIDER_COLOR }}>
              |
            </Text>
            <Pressable onPress={onOpenMonthly}>
              <Text style={headerActionTextStyle}>
                {i18n.t("main.header.monthly")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
      <WeeklyCalendarStrip
        flatListRef={flatListRef}
        weeks={weeks}
        weekDays={weekDays}
        gratitudeDate={gratitudeDate}
        diaryCountByDate={diaryCountByDate}
        weekStripExtraData={weekStripExtraData}
        getDisplayReplyStatusForDate={getDisplayReplyStatusForDate}
        onSelectDate={onSelectDate}
        onScrollEnd={onWeekScrollEnd}
      />
    </View>
  );
}
