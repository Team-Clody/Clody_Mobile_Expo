import { Stack } from "expo-router";
import { useEffect, useState, createContext } from "react";
import { View, Image } from "react-native";
import * as SplashScreen from "expo-splash-screen";
export const AuthContext = createContext<{}>({});
SplashScreen.preventAutoHideAsync().catch(() => {});
function AppLoader({ children }: { children: React.ReactNode }) {
  const [isAppReady, setAppReady] = useState(false);
  useEffect(() => {
    async function prepare() {
      // 여기에 로그인 로직 스타트
      setTimeout(async () => {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }, 10000);
    }
    prepare();
  }, []);

  if (!isAppReady) return null;
  return <View style={{ flex: 1 }}>{children}</View>;
}

export default function RootLayout() {
  return (
    <AppLoader>
      <Stack screenOptions={{ headerShown: false }} />
    </AppLoader>
  );
}
