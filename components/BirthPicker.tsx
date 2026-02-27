import { View } from "react-native";
import WheelPicker from "./WheelPicker";
import { useRef } from "react";

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
  const dayItems = Array.from({ length: 31 }, (_, i) =>
    (i + 1).toString().padStart(2, "0"),
  );
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
  const { ampm, hour, minute } = initValue || {};

  const selectedAMPM = useRef("");
  const selectedHour = useRef("");
  const selectedMinute = useRef("");

  const handleIndexChange = (category: string, item: string) => {
    switch (category) {
      case "day":
        selectedAMPM.current = item;
        break;
      case "month":
        selectedHour.current = item;
        break;
      case "year":
        selectedMinute.current = item;
        break;
      default:
        throw new Error("Invalid time category");
    }

    onTimeChange({
      ampm: selectedAMPM.current,
      hour: selectedHour.current,
      minute: selectedMinute.current,
    });
  };

  return (
    <View
      style={{
        flexDirection: "row",
        height: itemHeight * 3,
        justifyContent: "center",
      }}
    >
      <WheelPicker
        items={dayItems}
        onItemChange={(item) => handleIndexChange("day", item)}
        itemHeight={itemHeight}
        initValue={ampm}
        containerStyle={{ marginRight: 60 }}
      />
      <WheelPicker
        items={monthItems}
        onItemChange={(item) => handleIndexChange("month", item)}
        itemHeight={itemHeight}
        initValue={hour}
        containerStyle={{ marginHorizontal: 12 }}
      />
      <WheelPicker
        items={yearItems}
        onItemChange={(item) => handleIndexChange("year", item)}
        itemHeight={itemHeight}
        initValue={minute}
        containerStyle={{ paddingHorizontal: 20 }}
      />
      <View
        style={{
          position: "absolute",
          height: itemHeight,
          top: itemHeight,
          //   backgroundColor: Color.neutral5,
          backgroundColor: "#f1f2f3",
          borderRadius: 7,
          left: 0,
          right: 0,
          zIndex: -1,
        }}
      ></View>
    </View>
  );
};

export default TimePicker;
