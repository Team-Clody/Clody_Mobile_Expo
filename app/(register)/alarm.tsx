import { Text, Pressable, StyleSheet, Platform } from "react-native";
import { useContext, useEffect, useState } from "react";
import OnboardingLayout from "@/components/OnboardingLayout";
import { useFonts } from "expo-font";
import { RegisterContext } from "./_layout";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";

export default function NameScreen() {
  const { form, setForm } = useContext(RegisterContext)!;
  const [isValid, setIsValid] = useState(true);
  const [fontsLoaded] = useFonts({
    PretendardMedium: require("../../assets/fonts/Pretendard-Medium.otf"),
  });
  const navigation = useNavigation() as any;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener("transitionEnd", (e) => {
      if (e.data.closing === false) {
        if (!isReady) {
          setIsReady(!isReady);
        }
      }
    });
    return unsubscribe;
  }, [navigation, isReady]);
  const [date, setDate] = useState(new Date());
  const [showIOSPicker, setShowIOSPicker] = useState(false);

  const onChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }

    if (Platform.OS === "ios") {
      setShowIOSPicker(false);
    }
  };
  useEffect(() => {
    setForm({ ...form, alarm: String(date) });
  }, [date]);

  const openPicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: date,
        mode: "time",
        is24Hour: false,
        display: "spinner",
        onChange,
        positiveButton: { label: "확인", textColor: "#111" },
        negativeButton: { label: "취소", textColor: "#999" },
      });
    } else {
      setShowIOSPicker(true);
    }
  };

  const formatTime = (d: Date) => {
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const period = hours >= 12 ? "오후" : "오전";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;

    return `${period} ${displayHour}시 ${minutes
      .toString()
      .padStart(2, "0")}분`;
  };

  return (
    <OnboardingLayout
      showBack={true}
      isValid={isValid}
      ready={isReady}
      text1={"몇 시에 감사일기\n작성 알림을 드릴까요?"}
      text2={"잊지 않고 감사일기를 작성할 수 있도록 알림을 보내드려요"}
    >
      <Pressable style={styles.selectBox} onPress={openPicker}>
        <Text style={styles.selectText}>{formatTime(date)}</Text>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </Pressable>
      // use DatePicker
      {Platform.OS === "ios" && showIOSPicker && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={onChange}
        />
      )}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  selectBox: {
    borderWidth: 1,
    borderColor: "#929ca0",
    borderRadius: 8,
    marginTop: 50,
    paddingHorizontal: 14,
    height: 56,
    backgroundColor: "#F9FAFB",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectText: {
    fontSize: 16,
    color: "#111827",
  },
});
