import { View } from "react-native";
import WheelPicker from "./WheelPicker";
import { useEffect, useRef, useState } from "react";

interface Time {
  ampm: string;
  hour: string;
  minute: string;
}

interface Props {
  onTimeChange: (time: Time) => void;
  itemHeight: number;
  initValue?: Time;
}

const TimePicker = ({ onTimeChange, itemHeight, initValue }: Props) => {
  const ampmItems = ["오전", "오후"];
  const hourItems = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0"),
  );
  const minuteItems = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );
  const [selectedAMPM, setSelectedAMPM] = useState(
    initValue?.ampm && ampmItems.includes(initValue.ampm) ? initValue.ampm : "오전",
  );
  const [selectedHour, setSelectedHour] = useState(
    initValue?.hour && hourItems.includes(initValue.hour) ? initValue.hour : "09",
  );
  const [selectedMinute, setSelectedMinute] = useState(
    initValue?.minute && minuteItems.includes(initValue.minute)
      ? initValue.minute
      : "30",
  );
  const lastEmittedRef = useRef<Time | null>(null);

  useEffect(() => {
    const nextValue: Time = {
      ampm: selectedAMPM,
      hour: selectedHour,
      minute: selectedMinute,
    };
    const prevValue = lastEmittedRef.current;
    const changed =
      !prevValue ||
      prevValue.ampm !== nextValue.ampm ||
      prevValue.hour !== nextValue.hour ||
      prevValue.minute !== nextValue.minute;
    if (!changed) return;
    lastEmittedRef.current = nextValue;
    onTimeChange(nextValue);
  }, [onTimeChange, selectedAMPM, selectedHour, selectedMinute]);

  return (
    <View
      style={{
        flexDirection: "row",
        height: itemHeight * 5,
        justifyContent: "center",
      }}
    >
      <WheelPicker
        items={ampmItems}
        onItemChange={setSelectedAMPM}
        itemHeight={itemHeight}
        initValue={selectedAMPM}
        containerStyle={{ marginRight: 60 }}
      />
      <WheelPicker
        items={hourItems}
        onItemChange={setSelectedHour}
        itemHeight={itemHeight}
        initValue={selectedHour}
        containerStyle={{ marginHorizontal: 12 }}
      />
      {/* <View
        style={{
          height: itemHeight * 3,
          alignItems: "center",
          justifyContent: "center",
        }}
      ></View> */}
      <WheelPicker
        items={minuteItems}
        onItemChange={setSelectedMinute}
        itemHeight={itemHeight}
        initValue={selectedMinute}
        containerStyle={{ paddingHorizontal: 20 }}
      />
      <View
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

export default TimePicker;
