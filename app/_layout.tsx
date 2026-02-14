import { Stack, Redirect } from "expo-router";
import { useEffect, useState, createContext } from "react";
import { View, Image, Text } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";

export const AuthContext = createContext<{
  login?: () => Promise<any>;
  logout?: () => Promise<any>;
  isLoggedIn: boolean;
}>({});

SplashScreen.preventAutoHideAsync().catch(() => {});
function AppLoader({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const login = () => {
    setIsLoggedIn(true);
    return Promise.all([
      SecureStore.setItemAsync("accessToken", "12313"),
      SecureStore.setItemAsync("refreshToken", "1231"),
    ]);
  };
  const logout = () => {
    setIsLoggedIn(false);
    return Promise.all([
      SecureStore.deleteItemAsync("accessToken"),
      SecureStore.deleteItemAsync("refreshToken"),
    ]);
  };

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (accessToken) setIsLoggedIn(true);
      } catch (e) {
        console.error(e);
      }
    };

    async function prepare() {
      await checkLogin();
      setTimeout(async () => {
        await SplashScreen.hideAsync();
      }, 2000);
    }
    prepare();
  }, []);

  return (
    <AuthContext value={{ login, logout, isLoggedIn }}>{children}</AuthContext>
  );
}

export default function RootLayout() {
  return (
    <AppLoader>
      <Stack screenOptions={{ headerShown: false }} />
    </AppLoader>
  );
}
