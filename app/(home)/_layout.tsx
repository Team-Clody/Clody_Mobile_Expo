import { Slot, Stack } from "expo-router";
import { createContext, useEffect, useState } from "react";
interface HomeForm {
  email: string;
  nickname: string;
  birthDate: string;
  fcmToken: string;
  gender: "male" | "female" | "";
  alarm: string;
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
  });

  return (
    <HomeContext value={{ form, setForm }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </HomeContext>
  );
}
