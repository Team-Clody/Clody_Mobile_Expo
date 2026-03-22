import { Stack } from "expo-router";
import { createContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

import axios from "axios";

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
    const loadUser = async () => {
      try {
        // 1. 토큰 가져오기
        const accessToken = await SecureStore.getItemAsync("accessToken");
        console.log(accessToken);
        if (!accessToken) return;

        // 2. API 호출
        const res = await axios.get(
          "https://test.clodycorp.com/api/v2/user/info",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const user = res.data.data;
        console.log(user);
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
      } catch (err) {
        console.log("유저 정보 가져오기 실패", err);
      }
    };

    loadUser();
  }, []);

  return (
    <HomeContext.Provider value={{ form, setForm }}>
      <Stack screenOptions={{ headerShown: false }} />
    </HomeContext.Provider>
  );
}
