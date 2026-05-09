import { initializeKakaoSDK } from "@react-native-kakao/core";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Platform } from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import { AppProvider } from "@/lib/store";

const APP_BACKGROUND = "#FFFFFF";

export default function RootLayout() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(APP_BACKGROUND);
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const key = (
      Constants.expoConfig?.extra as { kakaoNativeAppKey?: string } | undefined
    )?.kakaoNativeAppKey;
    if (!key) {
      console.warn("[Kakao] extra.kakaoNativeAppKey is missing; SDK not initialized");
      return;
    }
    void initializeKakaoSDK(key);
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const extra = Constants.expoConfig?.extra as
      | { googleIosClientId?: string; googleWebClientId?: string }
      | undefined;
    GoogleSignin.configure({
      webClientId: extra?.googleWebClientId,
      iosClientId: extra?.googleIosClientId,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: APP_BACKGROUND }}
          edges={["top", "right", "bottom", "left"]}
        >
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: APP_BACKGROUND },
            }}
          />
        </SafeAreaView>
      </AppProvider>
    </SafeAreaProvider>
  );
}
