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
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DeviceProvider } from "@/shared/contexts/DeviceContext";
import { ModalProvider } from "@/shared/contexts/ModalContext";
import { ToastProvider } from "@/shared/contexts/ToastContext";
import { ModalContainer } from "@/shared/components/modal/ModalContainer";
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
  revoke?: () => void;
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
    GoogleSignin.configure({
      webClientId:
        "430648671385-fpd7ugcuko0dphopbt329mh9r7lml8bc.apps.googleusercontent.com",
      iosClientId:
        "430648671385-2l5bjp3apfjp0bed20646vk3orvj04e3.apps.googleusercontent.com",
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const id = await getKeyHashAndroid();
        let accessToken = await SecureStore.getItemAsync("accessToken");
        let refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (accessToken && (await authService.isAccessTokenValid(accessToken))) {
          setIsLoggedIn(true);
          return;
        }
        if (refreshToken) {
          const ok = await authService.reissueWithRefreshToken(refreshToken);
          setIsLoggedIn(ok);
          return;
        }
        setIsLoggedIn(false);
        return;
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
      } else if (platform === "google") {
        result = await authService.googleLogin();
      } else {
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
  const revoke = async () => {
    try {
      const token = await SecureStore.getItem("accessToken");
      const res = await axios.delete(
        "https://test.clodycorp.com/api/v1/user/revoke",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      await logout();
    } catch (e) {}
  };
  return (
    <SafeAreaProvider>
    <DeviceProvider>
      <ModalProvider>
        <ToastProvider>
          <AuthContext
            value={{
              login,
              locale,
              logout,
              signup,
              revoke,
              finIntroduce,
              isLoggedIn,
              finRegister,
              resetAuthState,
            }}
          >
            <StatusBar style="auto" animated translucent={true} />
            <Stack screenOptions={{ headerShown: false }}></Stack>
            <ModalContainer />
          </AuthContext>
        </ToastProvider>
      </ModalProvider>
    </DeviceProvider>
    </SafeAreaProvider>
  );
}
