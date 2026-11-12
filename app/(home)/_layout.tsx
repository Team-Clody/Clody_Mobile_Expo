import { Redirect, Stack } from "expo-router";
import { createContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

import axios from "axios";

import {
  DEV_BYPASS_AUTH,
} from "@/shared/config/devAuth";
import { useAppStore } from "@/store/useAppStore";

interface HomeForm {
  email: string;
  nickname: string;
  birthDate: string;
  fcmToken: string;
  gender: "male" | "female" | "";
  alarm: string;
  cloverCount: number;
}

interface HomeContextType {
  form: HomeForm;
  setForm: React.Dispatch<React.SetStateAction<HomeForm>>;
}

export const HomeContext = createContext<HomeContextType | null>(null);

export default function Home() {
  const authReady = useAppStore((state) => state.authReady);
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  const [form, setForm] = useState<HomeForm>({
    email: "",
    nickname: "",
    birthDate: "",
    fcmToken: "",
    gender: "",
    alarm: "",
    cloverCount: 0,
  });

  useEffect(() => {
    if (!authReady || (!isLoggedIn && !DEV_BYPASS_AUTH)) return;
    let active = true;
    const loadUser = async () => {
      if (DEV_BYPASS_AUTH) {
        setForm({
          email: "dev@clody.test",
          nickname: "Dev",
          birthDate: "2000-01-01",
          fcmToken: "",
          gender: "male",
          alarm: "",
          cloverCount: 0,
        });
        return;
      }

      try {
        // 1. 토큰 가져오기
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (!active || !accessToken) return;

        // 2. API 호출
        const res = await axios.get(
          "https://test.clodycorp.com/api/v2/user/info",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!active) return;
        const user = res.data.data;
        // 3. form에 데이터 세팅
        setForm({
          email: user.email || "",
          nickname: user.name || "",
          birthDate: user.birthDate || "",
          fcmToken: user.fcmToken || "",
          gender: user.gender || "",
          alarm: user.alarm || "",
          cloverCount: user.cloverCount,
        });
      } catch {
        if (active) console.warn("[Home] Failed to load user profile.");
      }
    };

    void loadUser();
    return () => { active = false; };
  }, [authReady, isLoggedIn]);

  if (!authReady) return null;
  if (!isLoggedIn && !DEV_BYPASS_AUTH) return <Redirect href="/introduce" />;

  return (
    <HomeContext.Provider value={{ form, setForm }}>
      <Stack screenOptions={{ headerShown: false }} />
    </HomeContext.Provider>
  );
}
