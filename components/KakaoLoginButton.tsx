import { Pressable, Text, StyleSheet, Image, View } from "react-native";
import { useFonts } from "expo-font";

export default function KakaoLoginButton({ onPress }: any) {
  const [fontsLoaded] = useFonts({
    PretendardSemiBold: require("../assets/fonts/Pretendard-SemiBold.otf"),
  });
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <View style={styles.content}>
        <Image
          source={require("@/assets/images/ic_signin_btn_kakao.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={styles.text}>카카오 로그인</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FEE500",
    height: 50,
    width: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  text: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "PretendardSemiBold",
  },
});
