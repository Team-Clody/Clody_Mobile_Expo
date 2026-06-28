import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

import { AuthAPI } from "@/api/authAPI";
import type { GetAccountResponseDTO } from "@/api/dto/myPage/response/getAccountResponseDTO";
import { useApp } from "@/store/useAppStore";
import { ApiResponse, BASE_URL } from "@/shared/http";
import { tokenStorage } from "@/shared/storage/tokenStorage";
import {
  DEV_BYPASS_AUTH,
  enterAppWithDevBypass,
} from "@/shared/config/devAuth";

const MAIN_HREF = "/(home)/(tabs)/main" as const;

function isUserInfoResponseOk(
  data: unknown,
): data is ApiResponse<GetAccountResponseDTO> {
  if (data == null || typeof data !== "object") return false;
  const d = data as ApiResponse<GetAccountResponseDTO>;
  if (d.data == null || typeof d.data !== "object") return false;
  return (
    typeof d.data.email === "string" &&
    typeof d.data.name === "string" &&
    typeof d.data.platform === "string" &&
    typeof d.data.cloverCount === "number"
  );
}

export default function Index() {
  const router = useRouter();
  const { setIsLoggedIn } = useApp();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (DEV_BYPASS_AUTH) {
        await enterAppWithDevBypass();
        if (cancelled) return;
        router.replace(MAIN_HREF);
        return;
      }

      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        setIsLoggedIn(false);
        router.replace("/introduce");
        return;
      }

      let userInfoValid = false;
      try {
        const res = await axios.get<unknown>(`${BASE_URL}/api/v2/user/info`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          validateStatus: () => true,
          timeout: 30_000,
        });
        userInfoValid =
          res.status === 200 && isUserInfoResponseOk(res.data);
      } catch {
        userInfoValid = false;
      }

      if (cancelled) return;

      if (userInfoValid) {
        setIsLoggedIn(true);
        router.replace(MAIN_HREF);
        return;
      }

      try {
        const tokens = await AuthAPI.reissueToken();
        await tokenStorage.saveTokens(tokens.accessToken, tokens.refreshToken);
        if (cancelled) return;
        setIsLoggedIn(true);
        router.replace(MAIN_HREF);
      } catch {
        await tokenStorage.clearTokens();
        if (cancelled) return;
        setIsLoggedIn(false);
        router.replace("/introduce");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, setIsLoggedIn]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
