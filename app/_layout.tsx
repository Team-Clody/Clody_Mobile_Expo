import { Stack } from "expo-router";
import { useEffect, useState, createContext, useCallback } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";
import {
  initializeKakaoSDK,
  getKeyHashAndroid,
} from "@react-native-kakao/core";
import authService from "@/services/authService";
import { StatusBar } from "expo-status-bar";
import axios from "axios";
SplashScreen.preventAutoHideAsync().catch(() => {});
export const AuthContext = createContext<{
  login: (platform: string) => Promise<void>;
  logout?: () => Promise<any>;
  resetAuthState: () => void;
  finIntroduce: boolean;
  isLoggedIn: boolean;
  finRegister: boolean;
}>({});

export default function RootLayout() {
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
        console.log(id);
        let accessToken = await SecureStore.getItemAsync("accessToken");
        let refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (accessToken) {
          if (await authService.isAccessTokenValid(accessToken)) {
            // 1. 토큰이 유효함
            setIsLoggedIn(true);
            return;
          } else {
            if (refreshToken) {
              authService.reissueWithRefreshToken(refreshToken);
            } else {
              setIsLoggedIn(false);
              return;
            }
          }
        } else {
          if (refreshToken) {
            authService.reissueWithRefreshToken(refreshToken);
          } else {
            setIsLoggedIn(false);
            return;
          }
        }
        setIsLoggedIn(false);

        return;
      } catch (e) {
        console.error(e);
      }
    };

    async function prepare() {
      await checkLogin();
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
      setIsLoggedIn(true);
    } catch (e) {
      // if (axios.isAxiosError(e)) {
      //   const status = e.response?.status;
      //   if (status === 404) {
      //     setFinRegister(true);
      //   } else {
      //     console.log("API 에러:", status);
      //   }
      // } else {
      //   console.log("axios 아님:", e);
      // }
      setFinIsIntroduce(true);
      setFinRegister(false);
      console.error("login error:", e);
    }
  };
  const logout = () => {
    setIsLoggedIn(false);
    return Promise.all([
      SecureStore.deleteItemAsync("accessToken"),
      SecureStore.deleteItemAsync("refreshToken"),
    ]);
  };

  return (
    <AuthContext
      value={{
        login,
        logout,
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
