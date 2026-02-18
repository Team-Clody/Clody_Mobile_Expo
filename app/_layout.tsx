import { router, Stack } from "expo-router";
import { useEffect, useState, createContext } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";
import {
  initializeKakaoSDK,
  getKeyHashAndroid,
} from "@react-native-kakao/core";
import authService from "@/services/authService";
import { StatusBar } from "expo-status-bar";
import axios from "axios";
import * as Notifications from "expo-notifications";
import * as Localization from "expo-localization";
import * as Font from "expo-font";
SplashScreen.preventAutoHideAsync().catch(() => {});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
export const AuthContext = createContext<{
  login: (platform: string) => Promise<void>;
  logout?: () => Promise<any>;
  signup?: () => void;
  locale: Localization.Locale;
  resetAuthState: () => void;
  finIntroduce: boolean;
  isLoggedIn: boolean;
  finRegister: boolean;
}>({});

export default function RootLayout() {
  const locale = Localization.getLocales()[0];
  const [finIntroduce, setFinIsIntroduce] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [finRegister, setFinRegister] = useState(true);

  const resetAuthState = () => {
    setFinIsIntroduce(false);
    setFinRegister(true);
  };

  useEffect(() => {
    initializeKakaoSDK("eb5b3511f81201dba4850861989793f6");
  }, []);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const id = await getKeyHashAndroid();
        let accessToken = await SecureStore.getItemAsync("accessToken");
        let refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (accessToken) {
          if (await authService.isAccessTokenValid(accessToken)) {
            setIsLoggedIn(true);
            return;
          } else {
            if (refreshToken) {
              await authService.reissueWithRefreshToken(refreshToken);
              setIsLoggedIn(true);
              return;
            } else {
              setIsLoggedIn(false);
              return;
            }
          }
        } else {
          if (refreshToken) {
            await authService.reissueWithRefreshToken(refreshToken);
            setIsLoggedIn(true);
            return;
          } else {
            setIsLoggedIn(false);
            return;
          }
          return;
        }
        setIsLoggedIn(false);
        return;
      } catch (e) {
        console.error(e);
      }
    };
    async function loadFonts() {
      await Font.loadAsync({
        PretendardRegular: require("../assets/fonts/Pretendard-Regular.otf"),
        PretendardBold: require("../assets/fonts/Pretendard-Bold.otf"),
        PretendardMedium: require("../assets/fonts/Pretendard-Medium.otf"),
        PretendardSemiBold: require("../assets/fonts/Pretendard-SemiBold.otf"),
      });
    }
    async function prepare() {
      await checkLogin();
      await loadFonts();
      await SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  const login = async (platform: string) => {
    try {
      let result;
      if (platform === "kakao") {
        result = await authService.kakaoLogin();
      } else if (platform === "apple") {
        result = await authService.AppleLogin();
      }
      if (!result) {
        setIsLoggedIn(false);
        return;
      }
      await SecureStore.setItem("accessToken", result.accessToken);
      await SecureStore.setItem("refreshToken", result.refreshToken);
      setIsLoggedIn(true);
      setFinIsIntroduce(true);
      setFinRegister(true);
    } catch (e) {
      let result;
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        if (status === 404) {
          //없는 유저
          setFinIsIntroduce(true);
          setFinRegister(false);
        } else {
          console.log("API 에러:", status);
        }
      } else {
        console.log("axios 아님:", e);
      }
      console.error("login error:", e);
    }
  };
  const logout = () => {
    setIsLoggedIn(false);
    router.replace("/");
    return Promise.all([
      SecureStore.deleteItemAsync("accessToken"),
      SecureStore.deleteItemAsync("refreshToken"),
    ]);
  };
  const signup = () => {};

  return (
    <AuthContext
      value={{
        login,
        locale,
        logout,
        signup,
        finIntroduce,
        isLoggedIn,
        finRegister,
        resetAuthState,
      }}
    >
      <StatusBar style="auto" animated translucent={true} />
      <Stack screenOptions={{ headerShown: false }}></Stack>
    </AuthContext>
  );
}
