import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";

export default function KakaoLoginButton({ onPress }: any) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>카카오 로그인</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FEE500",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#000",
    fontWeight: "600",
    fontSize: 16,
  },
});
