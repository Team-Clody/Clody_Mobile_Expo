import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useContext, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import OnboardingLayout from "@/components/OnboardingLayout";
import { AuthContext } from "../_layout";
import { useFonts } from "expo-font";
import { RegisterContext } from "./_layout";
import * as Localization from "expo-localization";
export default function NameScreen() {
  const locale = Localization.getLocales()[0];
  let { languageTag } = locale;
  languageTag = languageTag.split("-")[0].toLowerCase();

  const { resetAuthState } = useContext(AuthContext);
  const { form, setForm } = useContext(RegisterContext)!;
  const [nickname, setNickname] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [fontsLoaded] = useFonts({
    PretendardMedium: require("../../assets/fonts/Pretendard-Medium.otf"),
  });
  type Gender = "none" | "female" | "male" | "custom";

  interface FormType {
    gender: Gender;
  }
  type LanguageTag = "en" | "ko";
  const OPTIONS: { value: Gender; labelEn: string; labelKo: string }[] = [
    { value: "female", labelEn: "Female", labelKo: "여성" },
    { value: "male", labelEn: "Male", labelKo: "남성" },
    { value: "none", labelEn: "Specify another", labelKo: "기타" },
  ];

  function Check() {
    return <Text style={{ color: "#20C073", fontSize: 18 }}>✓</Text>;
  }
  const [isReady, setIsReady] = useState(false);
  const navigation = useNavigation() as any;
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
  function Chevron() {
    return <Text style={{ color: "#A6AFBD", fontSize: 18 }}>✓</Text>;
  }

  const [gender, setGender] = useState<Gender | null>(null);
  useEffect(() => {
    setForm({ ...form, gender: gender });
  }, [gender]);

  return (
    <OnboardingLayout
      showBack={true}
      isValid={isValid}
      ready={isReady}
      text1={
        languageTag === "en"
          ? "How do you identify\nyour gender?"
          : "How do you identify your gender?"
      }
      text2={
        languageTag === "en"
          ? "Used to recommend gratitude prompts tailored to you."
          : "Used to recommend gratitude prompts tailored to you."
      }
    >
      <View style={{ gap: 12, marginTop: "auto", marginBottom: 20 }}>
        {OPTIONS.map((opt) => {
          const selected = gender === opt.value;
          const label = languageTag === "en" ? opt.labelEn : opt.labelKo;

          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                setIsValid(true);
                setGender(opt.value);
              }}
              style={({ pressed }) => [
                styles.row,
                selected && styles.rowSelected,
                pressed && styles.rowPressed,
              ]}
            >
              <Text
                style={[styles.rowText, selected && styles.rowTextSelected]}
              >
                {label}
              </Text>

              {selected ? <Check /> : <Chevron />}
            </Pressable>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowSelected: {
    borderColor: "#20C073",
    backgroundColor: "#F4FFFA",
  },
  rowPressed: {
    opacity: 0.98,
    transform: [{ scale: 0.995 }],
  },
  rowText: {
    fontSize: 16,
    color: "#111827",
  },
  rowTextSelected: {
    color: "#20C073",
    fontWeight: "600",
  },

  // (옵션) 직접 Next 버튼 렌더할 때 쓰는 스타일
  nextBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnDisabled: {
    backgroundColor: "#E5E7EB",
  },
  nextText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
