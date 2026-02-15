import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useContext, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import OnboardingLayout from "@/components/OnboardingLayout";
import { AuthContext } from "../_layout";
import { useFonts } from "expo-font";
export default function NameScreen() {
  const { resetAuthState } = useContext(AuthContext);
  const [nickname, setNickname] = useState("");
  const navigation = useNavigation();
  let isValid = /^[a-zA-Z0-9가-힣]{2,10}$/.test(nickname);
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
      text1={"만나서 반가워요\n어떻게 불러드릴까요?"}
      text2={"프로필에 보일 닉네임이에요"}
    >
      <View style={styles.inputWrap}>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="닉네임을 입력해주세요."
          placeholderTextColor="#9CA3AF"
          maxLength={10}
          style={styles.input}
          onSubmitEditing={() => {
            isValid = false;
            console.log("엔터 눌림");
          }}
        />

        {nickname.length >= 0 && (
          <Pressable onPress={() => setNickname("")}>
            <Ionicons name="close-circle" size={20} color="#C7CDD6" />
          </Pressable>
        )}
      </View>
      <Text style={styles.counter}>{nickname.length}/10</Text>
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
});
