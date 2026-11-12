import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { initializeKakaoSDK } from "@react-native-kakao/core";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { initializeAdMob } from "@/shared/ads";
import { useAppStore } from "@/store/useAppStore";
import { AppUpdateGate } from "@/shared/updates/AppUpdateGate";

const APP_BACKGROUND = "#FFFFFF";
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PretendardRegular: require("@/assets/fonts/Pretendard-Regular.otf"),
    PretendardMedium: require("@/assets/fonts/Pretendard-Medium.otf"),
    PretendardSemiBold: require("@/assets/fonts/Pretendard-SemiBold.otf"),
    PretendardBold: require("@/assets/fonts/Pretendard-Bold.otf"),
  });

  if (!fontsLoaded) return null;
  return (
    <AppUpdateGate>
      <AppLayout />
    </AppUpdateGate>
  );
}

function AppLayout() {
  const pathname = usePathname();
  // 배경이 회색인 화면은 상태바 영역도 같은 색으로 맞춰 색 단절을 없앤다
  const topBackground =
    pathname === "/mypage"
      ? "#EFEFF4"
      : pathname === "/teamClody"
        ? "#F3F3F6"
        : APP_BACKGROUND;
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

  useEffect(() => {
    if (Platform.OS === "web") return;
    void initializeAdMob().catch((error) =>
      console.warn("[AdMob] initialize failed", error),
    );
  }, []);

  useEffect(() => {
    void useAppStore.getState().hydrateAuthFromStorage();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: topBackground }}
          edges={["top", "right", "left"]}
        >
          <SafeAreaView
            style={{ flex: 1, backgroundColor: APP_BACKGROUND }}
            edges={["bottom"]}
          >
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: APP_BACKGROUND },
              }}
            />
          </SafeAreaView>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
