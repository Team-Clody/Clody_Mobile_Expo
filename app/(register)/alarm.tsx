import {
  Text,
  Pressable,
  StyleSheet,
  View,
  Modal,
  Animated,
} from "react-native";
import { useContext, useEffect, useState } from "react";
import OnboardingLayout from "@/components/OnboardingLayout";
import { useFonts } from "expo-font";
import { RegisterContext } from "./_layout";
import * as Localization from "expo-localization";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import TimePicker from "@/components/TimePicker";
import EnTimePicker from "@/components/EnTimePicker";
export default function NameScreen() {
  const locale = Localization.getLocales()[0];
  console.log(locale);
  let { languageTag } = locale;
  languageTag = languageTag.split("-")[0].toLowerCase();

  const { form, setForm } = useContext(RegisterContext)!;
  const [isValid, setIsValid] = useState(true);
  const [fontsLoaded] = useFonts({
    PretendardRegular: require("../../assets/fonts/Pretendard-Regular.otf"),
    PretendardBold: require("../../assets/fonts/Pretendard-Bold.otf"),
    PretendardMedium: require("../../assets/fonts/Pretendard-Medium.otf"),
    PretendardSemiBold: require("../../assets/fonts/Pretendard-SemiBold.otf"),
  });
  const navigation = useNavigation() as any;
  const [isReady, setIsReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0]; // 아래에서 시작
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

  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(21, 30, 0, 0);
    return d;
  });
  const [selectedTime, setSelectedTime] = useState<{
    ampm: string;
    hour: string;
    minute: string;
  } | null>(null);

  useEffect(() => {
    setForm({ ...form, alarm: String(date) });
    console.log(form);
  }, [date]);

  const openPicker = () => {
    setVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closePicker = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
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
  const formatTime2 = (d: Date) => {
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;

    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };
  const handleConfirm = () => {
    if (!selectedTime) return;

    const { ampm, hour, minute } = selectedTime;

    let h = parseInt(hour, 10);
    const m = parseInt(minute, 10);

    // 12시간 → 24시간 변환
    if (ampm === "오후" && h !== 12) {
      h += 12;
    }
    if (ampm === "오전" && h === 12) {
      h = 0;
    }

    const now = new Date();
    const newDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      h,
      m,
      0,
    );

    setDate(newDate); // 기존 date 상태 업데이트
    setForm({ ...form, alarm: newDate.toString() });

    closePicker();
  };
  const handleConfirm2 = () => {
    if (!selectedTime) return;

    const { ampm, hour, minute } = selectedTime;

    let h = parseInt(hour, 10);
    const m = parseInt(minute, 10);

    // 12시간 → 24시간 변환
    if (ampm === "PM" && h !== 12) {
      h += 12;
    }
    if (ampm === "AM" && h === 12) {
      h = 0;
    }

    const now = new Date();
    const newDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      h,
      m,
      0,
    );

    setDate(newDate); // 기존 date 상태 업데이트
    setForm({ ...form, alarm: newDate.toString() });

    closePicker();
  };
  return (
    <OnboardingLayout
      showBack={true}
      isValid={isValid}
      ready={isReady}
      text1={
        languageTag === "en"
          ? "What time would you\nlike us to remind you to write?"
          : "몇 시에 감사일기\n작성 알림을 드릴까요?"
      }
      text2={
        languageTag === "en"
          ? "Clody will remind you to write your gratitude journal."
          : "잊지 않고 감사일기를 작성할 수 있도록 알림을 보내드려요"
      }
    >
      <Pressable style={styles.selectBox} onPress={openPicker}>
        <Text style={styles.selectText}>
          {languageTag === "en" ? formatTime2(date) : formatTime(date)}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </Pressable>
      <Modal transparent visible={visible} animationType="none">
        <View style={styles.overlay}>
          {/* 바깥 클릭 영역 */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closePicker} />

          {/* 실제 바텀시트 */}
          <Animated.View
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.sheetTitle}>
              {languageTag === "en"
                ? "Change reminder time"
                : "알림 시간을 선택해주세요"}
            </Text>
            {languageTag === "en" ? (
              <EnTimePicker
                itemHeight={40}
                onTimeChange={(time) => {
                  setSelectedTime(time);
                }}
              />
            ) : (
              <TimePicker
                itemHeight={40}
                onTimeChange={(time) => {
                  setSelectedTime(time);
                }}
              />
            )}

            <Pressable
              style={styles.confirmBtn}
              onPress={languageTag === "en" ? handleConfirm2 : handleConfirm}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "PretendardSemiBold",
                  fontSize: 16,
                }}
              >
                {languageTag === "en" ? "Save" : "확인"}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  bottomSheet: {
    height: 300, // 원하는 높이
    backgroundColor: "white",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 23,
  },

  sheetTitle: {
    fontSize: 18,
    marginBottom: 30,
    fontFamily: "PretendardBold",
  },

  confirmBtn: {
    marginTop: 20,
    backgroundColor: "#293038",
    paddingVertical: 18,
    borderRadius: 7,
    alignItems: "center",
  },
});
