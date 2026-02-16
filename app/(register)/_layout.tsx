import { Stack } from "expo-router";
import { createContext, useState } from "react";
interface RegisterForm {
  email: string;
  nickname: string;
  birthDate: string;
  fcmToken: string;
  gender: "male" | "female" | "none";
  alarm: string;
}
interface RegisterContextType {
  form: RegisterForm;
  setForm: React.Dispatch<React.SetStateAction<RegisterForm>>;
}
export const RegisterContext = createContext<RegisterContextType | null>(null);
export default function Register() {
  const [form, setForm] = useState<RegisterForm>({
    email: "",
    nickname: "",
    birthDate: "",
    fcmToken: "",
    gender: "none",
    alarm: "",
  });

  return (
    <RegisterContext value={{ form, setForm }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </RegisterContext>
  );
}
