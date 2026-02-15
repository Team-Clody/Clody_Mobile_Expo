import { Slot } from "expo-router";
import { createContext, useState } from "react";
interface RegisterForm {
  email: string;
  nickname: string;
  birthDate: string;
  fcmToken: string;
  gender: "male" | "female";
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
    gender: "male",
  });
  return (
    <RegisterContext value={{ form, setForm }}>
      <Slot />
    </RegisterContext>
  );
}
