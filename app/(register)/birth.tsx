import { View, Text, TextInput, StyleSheet } from "react-native";
import { useContext, useState, useRef } from "react";
import OnboardingLayout from "@/components/OnboardingLayout";
import { useFonts } from "expo-font";
import { RegisterContext } from "./_layout";
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
  return (
    <OnboardingLayout
      showBack={true}
      isValid={isValid}
      text1={"생년월일/성별을\n입력해 주세요"}
      text2={"맞춤형 감사일기 소재를 추천하기 위해 필요해요"}
    >
      <View style={styles.box}>
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
            style={styles.front}
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
});
