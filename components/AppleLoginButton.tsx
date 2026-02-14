import React from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { StyleSheet } from "react-native";

export default function AppleLoginButton({ onPress }: any) {
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={8}
      style={styles.button}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 50,
  },
});
