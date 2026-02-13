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
      setTimeout(async () => {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }, 2000);
    }
    prepare();
  }, []);

  if (!isAppReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#8FF76F",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          source={require("../assets/bootsplash/logo4x.png")}
          style={{
            width: 160,
            resizeMode: "contain",
          }}
        />
      </View>
    );
  }
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#8FF76F",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {children}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppLoader>
      <Stack screenOptions={{ headerShown: false }} />
    </AppLoader>
  );
}
