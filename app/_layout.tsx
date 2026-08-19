import { initializeKakaoSDK } from "@react-native-kakao/core";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import { useAppStore } from "@/store/useAppStore";

const APP_BACKGROUND = "#FFFFFF";
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PretendardRegular: require("@/assets/fonts/Pretendard-Regular.otf"),
    PretendardMedium: require("@/assets/fonts/Pretendard-Medium.otf"),
    PretendardSemiBold: require("@/assets/fonts/Pretendard-SemiBold.otf"),
    PretendardBold: require("@/assets/fonts/Pretendard-Bold.otf"),
  });

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(APP_BACKGROUND);
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    void SplashScreen.hideAsync();
  }, [fontsLoaded]);

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

  useEffect(() => {
    if (!fontsLoaded) return;
    void useAppStore.getState().hydrateAuthFromStorage();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
