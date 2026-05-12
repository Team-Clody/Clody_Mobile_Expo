import { View } from "react-native";
import WheelPicker from "./WheelPicker";
import { useEffect, useMemo, useRef, useState } from "react";

export interface BirthPickerValue {
  ampm: string;
  hour: string;
  minute: string;
}

interface Props {
  onTimeChange: (time: BirthPickerValue) => void;
  itemHeight: number;
  initValue?: BirthPickerValue;
}

const BirthPicker = ({ onTimeChange, itemHeight, initValue }: Props) => {
  const monthItems = [
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
  const currentYear = new Date().getFullYear();
  const startYear = 1900;

  const yearItems = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => (startYear + i).toString(),
  );
  const [selectedDay, setSelectedDay] = useState(
    initValue?.ampm && /^\d{2}$/.test(initValue.ampm) ? initValue.ampm : "01",
  );
  const [selectedMonth, setSelectedMonth] = useState(
    initValue?.hour && monthItems.includes(initValue.hour)
      ? initValue.hour
      : monthItems[0],
  );
  const [selectedYear, setSelectedYear] = useState(
    initValue?.minute && yearItems.includes(initValue.minute)
      ? initValue.minute
      : yearItems[yearItems.length - 1],
  );
  const lastEmittedRef = useRef<BirthPickerValue | null>(null);

  const dayItems = useMemo(() => {
    const monthIndex = monthItems.indexOf(selectedMonth);
    const year = Number(selectedYear);
    const maxDay = new Date(year, monthIndex + 1, 0).getDate();
    return Array.from({ length: maxDay }, (_, i) => String(i + 1).padStart(2, "0"));
  }, [monthItems, selectedMonth, selectedYear]);

  useEffect(() => {
    const clampedDay = Math.min(Number(selectedDay), dayItems.length);
    const nextDay = String(Math.max(1, clampedDay)).padStart(2, "0");
    if (nextDay !== selectedDay) {
      setSelectedDay(nextDay);
    }
  }, [dayItems, selectedDay]);

  useEffect(() => {
    const nextValue: BirthPickerValue = {
      ampm: selectedDay,
      hour: selectedMonth,
      minute: selectedYear,
    };
    const prevValue = lastEmittedRef.current;
    const hasChanged =
      !prevValue ||
      prevValue.ampm !== nextValue.ampm ||
      prevValue.hour !== nextValue.hour ||
      prevValue.minute !== nextValue.minute;

    if (!hasChanged) return;

    lastEmittedRef.current = nextValue;
    onTimeChange(nextValue);
  }, [selectedDay, selectedMonth, selectedYear, onTimeChange]);

  return (
    <View
      style={{
        flexDirection: "row",
        height: itemHeight * 5,
        justifyContent: "center",
      }}
    >
      <WheelPicker
        items={dayItems}
        onItemChange={setSelectedDay}
        itemHeight={itemHeight}
        initValue={selectedDay}
        containerStyle={{ marginRight: 60, zIndex: 1 }}
      />
      <WheelPicker
        items={monthItems}
        onItemChange={setSelectedMonth}
        itemHeight={itemHeight}
        initValue={selectedMonth}
        containerStyle={{ marginHorizontal: 12, zIndex: 1 }}
      />
      <WheelPicker
        items={yearItems}
        onItemChange={setSelectedYear}
        itemHeight={itemHeight}
        initValue={selectedYear}
        containerStyle={{ paddingHorizontal: 20, zIndex: 1 }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          height: itemHeight,
          top: itemHeight * 2,
          //   backgroundColor: Color.neutral5,
          backgroundColor: "#f1f2f3",
          borderRadius: 7,
          left: 0,
          right: 0,
          zIndex: 0,
        }}
      ></View>
    </View>
  );
};

export default BirthPicker;
