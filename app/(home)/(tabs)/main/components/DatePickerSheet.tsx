import { Animated, Pressable, Text, View } from "react-native";
import WheelPicker from "@/components/WheelPicker";
import i18n from "@/app/i18n/i18n";
import { EN_MONTH_ITEMS } from "../constants";
import { fontPreset } from "@/shared/theme/localeTypography";
import { getDaysInMonth, getNumericValue } from "../utils/dateUtils";

type DatePickerSheetProps = {
  translateY: Animated.Value;
  isKo: boolean;
  datePickerSessionKey: number;
  draftYear: number;
  draftMonth: number;
  draftDay: number;
  yearItems: string[];
  monthItems: string[];
  dayItems: string[];
  onClose: () => void;
  onDraftYearChange: (year: number) => void;
  onDraftMonthChange: (month: number) => void;
  onDraftDayChange: (day: number) => void;
  onApplyToday: () => void;
  onConfirm: () => void;
};

export function DatePickerSheet({
  translateY,
  isKo,
  datePickerSessionKey,
  draftYear,
  draftMonth,
  draftDay,
  yearItems,
  monthItems,
  dayItems,
  onClose,
  onDraftYearChange,
  onDraftMonthChange,
  onDraftDayChange,
  onApplyToday,
  onConfirm,
}: DatePickerSheetProps) {
  return (
    <>
      <Pressable
        onPress={onClose}
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
          paddingBottom: 30,
          transform: [{ translateY }],
        }}
      >
        <Text
          style={[
            fontPreset.bold,
            {
              fontSize: 16,
              color: "#20232a",
              marginTop: 20,
              marginLeft: 20,
              marginBottom: 18,
            },
          ]}
        >
          {i18n.t("main.datePicker.title")}
        </Text>
        <View
          style={{
            height: 220,
            marginBottom: 20,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {isKo ? (
            <>
              <WheelPicker
                key={`ko-year-${datePickerSessionKey}`}
                items={yearItems}
                initValue={`${draftYear}년`}
                itemHeight={44}
                onItemChange={(item) => {
                  const nextYear = getNumericValue(item);
                  if (!Number.isFinite(nextYear)) return;
                  onDraftYearChange(nextYear);
                }}
                containerStyle={{ width: 96 }}
              />
              <WheelPicker
                key={`ko-month-${datePickerSessionKey}`}
                items={monthItems}
                initValue={`${draftMonth}월`}
                itemHeight={44}
                onItemChange={(item) => {
                  const nextMonth = getNumericValue(item);
                  if (!Number.isFinite(nextMonth)) return;
                  if (nextMonth < 1 || nextMonth > 12) return;
                  onDraftMonthChange(nextMonth);
                }}
                containerStyle={{ width: 84 }}
              />
              <WheelPicker
                key={`ko-day-${datePickerSessionKey}`}
                items={dayItems}
                initValue={`${draftDay}일`}
                itemHeight={44}
                onItemChange={(item) => {
                  const nextDay = getNumericValue(item);
                  if (!Number.isFinite(nextDay)) return;
                  if (nextDay < 1 || nextDay > getDaysInMonth(draftYear, draftMonth))
                    return;
                  onDraftDayChange(nextDay);
                }}
                containerStyle={{ width: 84 }}
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
                  onDraftMonthChange(nextMonth);
                }}
                containerStyle={{ width: 128 }}
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
                  onDraftDayChange(nextDay);
                }}
                containerStyle={{ width: 76 }}
              />
              <WheelPicker
                key={`en-year-${datePickerSessionKey}`}
                items={yearItems}
                initValue={`${draftYear}`}
                itemHeight={44}
                onItemChange={(item) => {
                  const nextYear = getNumericValue(item);
                  if (!Number.isFinite(nextYear)) return;
                  onDraftYearChange(nextYear);
                }}
                containerStyle={{ width: 104 }}
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingVertical: 14,
            paddingHorizontal: 20,
          }}
        >
          <Pressable
            onPress={onApplyToday}
            style={{
              width: 80,
              height: 48,
              borderRadius: 6,
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
            onPress={onConfirm}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 6,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#293038",
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
}
