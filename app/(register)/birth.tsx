import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
} from "react-native";
import { useContext, useState, useRef, useEffect } from "react";
import OnboardingLayout from "@/components/OnboardingLayout";
import { useFonts } from "expo-font";
import { RegisterContext } from "./_layout";
import { useNavigation } from "expo-router";
import * as Localization from "expo-localization";
import BirthPicker from "@/components/BirthPicker";
import { Ionicons } from "@expo/vector-icons";
function getGenderFromRRN(code: string) {
  const num = Number(code);
  return num % 2 === 1 ? "male" : "female";
}
const validateBirthFront = (front: string) => {
  if (!/^\d{6}$/.test(front)) {
    return false;
  }

  const yy = Number(front.slice(0, 2));
  const mm = Number(front.slice(2, 4));
  const dd = Number(front.slice(4, 6));
  // 월 범위
  if (mm < 1 || mm > 12) {
    return false;
  }

  // 일 1차 범위
  if (dd < 1 || dd > 31) {
    return false;
  }

  const today = new Date();
  const currentYear = today.getFullYear();

  // 세기 추정 (앞자리만 있는 경우)
  let fullYear = yy > currentYear % 100 ? 1900 + yy : 2000 + yy;

  if (yy < 0) return false;

  const birthDate = new Date(fullYear, mm - 1, dd);

  if (
    birthDate.getFullYear() !== fullYear ||
    birthDate.getMonth() !== mm - 1 ||
    birthDate.getDate() !== dd
  ) {
    return false;
  }

  // 미래 날짜 체크
  if (birthDate > today) {
    return false;
  }

  return true;
};
export default function BirthScreen() {
  const [visible, setVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0]; // 아래에서 시작
  const closePicker = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };
  const openPicker = () => {
    setVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };
  const locale = Localization.getLocales()[0];
  console.log(locale);
  let { languageTag } = locale;
  languageTag = languageTag.split("-")[0].toLowerCase();
  const { form, setForm } = useContext(RegisterContext)!;
  const [birth, setBirth] = useState("");

  const [isValid, setIsValid] = useState(false);
  const [fontsLoaded] = useFonts({
    PretendardMedium: require("../../assets/fonts/Pretendard-Medium.otf"),
  });
  const [back, setBack] = useState("");
  const frontRef = useRef<TextInput>(null);
  const backRef = useRef<TextInput>(null);
  const [active, setActive] = useState(1);
  const [cursorPos, setCursorPos] = useState(0);
  const navigation = useNavigation() as any;
  const [isReady, setIsReady] = useState(false);
  const [birthText, setBirthText] = useState("December 22, 1998");
  const [init, setInit] = useState(false);
  const [selectedTime, setSelectedTime] = useState<{
    ampm: string;
    hour: string;
    minute: string;
  } | null>({
    ampm: "22", // day
    hour: "December", // month
    minute: "1998", // year
  });
  function validateRRNFront(rrnFront: string): boolean {
    // 1️⃣ 형식 체크 (6자리 숫자)
    if (!/^\d{6}$/.test(rrnFront)) return false;

    const yy = Number(rrnFront.slice(0, 2));
    const mm = Number(rrnFront.slice(2, 4));
    const dd = Number(rrnFront.slice(4, 6));

    // 2️⃣ 월 범위
    if (mm < 1 || mm > 12) return false;

    // 3️⃣ 일 1차 범위
    if (dd < 1 || dd > 31) return false;

    // 4️⃣ 세기 임시 추정 (현재 연도 기준 자동 판단)
    const today = new Date();
    const currentYY = today.getFullYear() % 100;
    const fullYear = yy > currentYY ? 1900 + yy : 2000 + yy;

    const date = new Date(fullYear, mm - 1, dd);

    // 5️⃣ 실제 존재하는 날짜인지 검증 (윤년 자동 포함)
    return (
      date.getFullYear() === fullYear &&
      date.getMonth() === mm - 1 &&
      date.getDate() === dd
    );
  }
  // month string -> "01"~"12"
  const monthToMM = (m) => {
    const map = {
      January: "01",
      February: "02",
      March: "03",
      April: "04",
      May: "05",
      June: "06",
      July: "07",
      August: "08",
      September: "09",
      October: "10",
      November: "11",
      December: "12",
    };

    // "Sep" 같은 축약형도 들어올 수 있으면 보정
    const normalized =
      typeof m === "string"
        ? m.trim().replace(/\.$/, "") // "Sep." 같은 경우 대비
        : "";

    if (map[normalized]) return map[normalized];

    // 축약형 대응
    const shortMap = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    if (shortMap[normalized]) return shortMap[normalized];

    // 이미 숫자("9","09")로 들어온 경우도 처리
    if (/^\d{1,2}$/.test(normalized)) return normalized.padStart(2, "0");

    return null; // 변환 불가
  };

  const handleConfirm = () => {
    const dayDD = String(selectedTime?.ampm ?? "").padStart(2, "0"); // "01"
    const mm = monthToMM(selectedTime?.hour); // "09"
    const yyyy = String(selectedTime?.minute ?? ""); // "1900"
    if (!mm) throw new Error(`월 변환 실패: ${selectedTime?.hour}`);
    if (!/^\d{4}$/.test(yyyy)) throw new Error(`년도 형식 오류: ${yyyy}`);
    if (!/^\d{2}$/.test(dayDD))
      throw new Error(`일 형식 오류: ${selectedTime?.ampm}`);

    const yy = yyyy.slice(2); // "1900" -> "00", "2019" -> "19"

    // 주민번호 앞자리 YYMMDD
    const rrnFront = `${yy}${mm}${dayDD}`;

    setBirth(rrnFront);
    setBirthText(formatBirthDate(selectedTime));
    if (validateRRNFront(rrnFront)) {
      setIsValid(true);
      setForm({
        ...form,
        birthDate: rrnFront,
      });
    } else {
      setIsValid(false);
    }

    setInit(true);

    closePicker();
  };
  useEffect(() => {
    console.log(form);
  }, [form]);
  const formatBirthDate = (
    time: {
      ampm: string;
      hour: string;
      minute: string;
    } | null,
  ) => {
    if (!time) return "";

    const month = time.hour; // "January"
    const day = Number(time.ampm); // "01" → 1
    const year = time.minute; // "1900"

    return `${month} ${day}, ${year}`;
  };
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

  return (
    <OnboardingLayout
      showBack={true}
      isValid={isValid}
      ready={isReady}
      text1={
        languageTag === "en"
          ? "When is\nyour birthday?"
          : "생년월일/성별을\n입력해 주세요"
      }
      text2={
        languageTag === "en"
          ? "Used to recommend gratitude prompts tailored to you."
          : "맞춤형 감사일기 소재를 추천하기 위해 필요해요"
      }
    >
      {languageTag === "en" ? (
        <>
          <Pressable
            style={[
              styles.selectBox,
              { marginTop: languageTag === "en" ? 35 : 50 },
            ]}
            onPress={openPicker}
          >
            <Text style={styles.selectText}>{birthText}</Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </Pressable>
          <Text
            style={[
              styles.errorText,
              !init && styles.errorHidden,
              isValid && styles.errorHidden,
            ]}
          >
            Please enter a valid date of birth.
          </Text>
          <Modal transparent visible={visible} animationType="none">
            <View style={styles.overlay}>
              {/* 바깥 클릭 영역 */}
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={closePicker}
              />

              {/* 실제 바텀시트 */}
              <Animated.View
                style={[
                  styles.bottomSheet,
                  { transform: [{ translateY: slideAnim }] },
                ]}
              >
                <Text style={styles.sheetTitle}>
                  Please select your date of birth
                </Text>
                <BirthPicker
                  itemHeight={40}
                  onTimeChange={(time) => {
                    setSelectedTime(time);
                  }}
                />

                <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
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
        </>
      ) : (
        <>
          <View
            style={[
              styles.box,
              { marginTop: languageTag === "en" ? 35 : 50 },
              back.length > 0 && !isValid && { borderColor: "#FF4D4F" },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                width: "100%",
                alignItems: "center",
              }}
            >
              <TextInput
                ref={frontRef}
                placeholder="생년월일 6자리"
                maxLength={6}
                style={[styles.front]}
                value={birth}
                onSelectionChange={(e) => {
                  const { start } = e.nativeEvent.selection;
                  setCursorPos(start);
                }}
                onFocus={() => {
                  setBack("");
                  setActive(1);
                }}
                onKeyPress={({ nativeEvent }) => {
                  const key = nativeEvent.key;

                  if (!isNaN(Number(key))) {
                    if (birth.length === 6 && cursorPos === 6) {
                      backRef.current?.focus();
                      setBack(key);
                      setActive(0);
                    }
                  }
                }}
                keyboardType="number-pad"
                onChangeText={(text) => {
                  if (/^[0-9]*$/.test(text)) {
                    setBirth(text);
                    setIsValid(false);
                    if (text.length == 6) {
                      backRef.current?.focus();
                      setBirth(text);
                    }
                  }
                }}
              ></TextInput>
              <Text style={styles.hyphen}>-</Text>
              <View style={styles.dotWrap}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i >= active && styles.activeDot]}
                  />
                ))}
              </View>
              <TextInput
                ref={backRef}
                value={back}
                maxLength={1}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === "Backspace" && back.length == 0) {
                    frontRef.current?.focus();
                    setBirth((prev) => prev.slice(0, -1));
                  }
                }}
                onChangeText={(text) => {
                  // 여기까지 왔다는건 7번째
                  if (/^[0-9]*$/.test(text)) {
                    setBack(text);
                    if (text.length > 0) {
                      setActive(0);
                      if (!/^[1-8]$/.test(text) || !validateBirthFront(birth)) {
                        setIsValid(false);
                      } else {
                        // 정상
                        setForm({
                          ...form,
                          birthDate: birth,
                          gender: getGenderFromRRN(text),
                        });
                        setIsValid(true);
                      }
                    } else {
                      setIsValid(false);
                      setActive(1);
                    }
                  }
                }}
              />
            </View>
          </View>
          <Text
            style={[
              styles.errorText,
              back.length < 1 && styles.errorHidden,
              isValid && styles.errorHidden,
            ]}
          >
            올바른 생년월일을 입력해주세요.
          </Text>
        </>
      )}
    </OnboardingLayout>
  );
}
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },

  box: {
    marginTop: 50,
    borderWidth: 1,
    borderColor: "#929ca0",
    borderRadius: 6,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  front: {
    paddingLeft: 14,
    fontSize: 17,
    color: "#111",
    width: "47%",
  },
  hyphen: {
    fontSize: 16,
    color: "#666",
    width: "3%",
  },
  dotWrap: {
    width: "47%",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 15,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 100,
    backgroundColor: "#D1D5DB",
  },
  activeDot: {
    backgroundColor: "#111",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  errorText: {
    paddingLeft: 5,
    marginTop: 4,
    fontSize: 13,
    color: "#FF4D4F",
    fontFamily: "PretendardMedium",
  },
  errorHidden: {
    opacity: 0,
  },
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
});
