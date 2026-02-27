import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useContext, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import OnboardingLayout from "@/components/OnboardingLayout";
import { AuthContext } from "../_layout";
import { useFonts } from "expo-font";
import { RegisterContext } from "./_layout";
import * as Localization from "expo-localization";
export default function NameScreen() {
  const locale = Localization.getLocales()[0];
  console.log(locale);
  let { languageTag } = locale;
  languageTag = languageTag.split("-")[0].toLowerCase();

  const { resetAuthState } = useContext(AuthContext);
  const { form, setForm } = useContext(RegisterContext)!;

  const [nickname, setNickname] = useState("");
  const navigation = useNavigation();
  const [isValid, setIsValid] = useState(false);
  const [fontsLoaded] = useFonts({
    PretendardMedium: require("../../assets/fonts/Pretendard-Medium.otf"),
  });
  // 뒤로가기 상태 리셋
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      resetAuthState();
    });

    return unsubscribe;
  }, [navigation, resetAuthState]);
  return (
    <OnboardingLayout
      showBack={true}
      isValid={isValid}
      text1={
        languageTag === "en"
          ? "Nice to meet you!\nWhat should I call you ?"
          : "만나서 반가워요\n어떻게 불러드릴까요?"
      }
      text2={
        languageTag === "en"
          ? "Nickname shown on your profile"
          : "프로필에 보일 닉네임이에요"
      }
    >
      <View
        style={[
          styles.inputWrap,
          nickname.length !== 0 && !isValid && { borderColor: "#FF4D4F" },
          { marginTop: languageTag === "en" ? 35 : 50 },
        ]}
      >
        <TextInput
          value={nickname}
          onChangeText={(text) => {
            if (/^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ]{1,10}$/.test(text)) {
              setIsValid(true);
            } else {
              setIsValid(false);
            }
            setNickname(text);
            setForm({ ...form, nickname: text });
          }}
          placeholder={
            languageTag === "en"
              ? "Please enter your nickname"
              : "닉네임을 입력해주세요."
          }
          placeholderTextColor="#9CA3AF"
          maxLength={10}
          style={styles.input}
        />

        {nickname.length >= 0 && (
          <Pressable onPress={() => setNickname("")}>
            <Ionicons name="close-circle" size={20} color="#C7CDD6" />
          </Pressable>
        )}
      </View>
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {
          <Text
            style={[
              styles.errorText,
              (nickname.length === 0 || isValid) && styles.errorHidden,
            ]}
          >
            {languageTag === "en"
              ? "Only letters and numbers are allowed."
              : "닉네임은 한글, 영문, 숫자만 가능해요."}
          </Text>
        }
        <Text style={styles.counter}>{nickname.length}/10</Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    marginTop: 50,
    borderWidth: 1,
    borderColor: "#929ca0",
    borderRadius: 6,
    paddingHorizontal: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  input: {
    fontFamily: "PretendardMedium",
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  counter: {
    marginTop: 4,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "right",
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: "#FF4D4F",
    fontFamily: "PretendardMedium",
  },
  errorHidden: {
    opacity: 0, // 🔥 자리 유지하면서 안보이게
  },
});
