import { Stack } from "expo-router";
import { createContext, useState, useEffect, useContext } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { request } from "../utils/request";
import { AuthContext } from "../_layout";
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
  const { setIsLoggedIn } = useContext(AuthContext);
  useEffect(() => {
    const loadUser = async () => {
      try {
        // 1. API 호출
        const res = await request("/api/v2/user/info");
        // const res = await axios.get(
        //   "https://test.clodycorp.com/api/v2/user/info",
        //   {
        //     headers: {
        //       Authorization: `Bearer ${accessToken}`,
        //     },
        //   },
        // );
        const user = res.data;
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
        if (err?.message === "토큰 재발급 실패") {
          setIsLoggedIn(false);
        }
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
