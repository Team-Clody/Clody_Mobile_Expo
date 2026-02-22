import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  Image,
  View,
  GestureResponderEvent,
} from "react-native";
import { useFonts } from "expo-font";

interface Props {
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}

export default function GoogleLoginButton({ onPress, disabled }: Props) {
  const [fontsLoaded] = useFonts({
    PretendardSemiBold: require("../assets/fonts/Pretendard-SemiBold.otf"),
    PretendardBold: require("../assets/fonts/Pretendard-Bold.otf"),
  });

  if (!fontsLoaded) return null;

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
    >
      <View style={styles.inner}>
        <Image
          source={require("@/assets/images/ic_signin_btn_google.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={styles.text}>Sign up with Google</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#F8F9FC",
    height: 50,
    width: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center", // 🔥 그룹을 중앙에
    marginBottom: 10,
  },

  pressed: {
    opacity: 0.8,
  },

  inner: {
    flexDirection: "row", // 🔥 아이콘 + 텍스트 묶기
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    width: 18,
    height: 18,
    marginRight: 8, // 🔥 텍스트와 간격
  },

  text: {
    color: "#000",
    fontSize: 16,
    fontFamily: "PretendardSemiBold",
  },
  disabled: {
    opacity: 0, // 흐리게
  },
});
