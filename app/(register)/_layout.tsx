import { Stack } from "expo-router";
import {
  createContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

const APP_BACKGROUND = "#FFFFFF";

export type RegisterForm = {
  nickname: string;
  /** YYMMDD (6 digits) for `authService` `convertBirth` */
  birthDate: string;
  gender: string;
  /** ISO string; only hours/minutes matter for notifications */
  alarm: string;
};

const defaultAlarmIso = (): string => {
  const d = new Date();
  d.setHours(21, 30, 0, 0);
  return d.toISOString();
};

export const RegisterContext = createContext<{
  form: RegisterForm;
  setForm: Dispatch<SetStateAction<RegisterForm>>;
} | null>(null);

export default function RegisterLayout() {
  const [form, setForm] = useState<RegisterForm>({
    nickname: "",
    birthDate: "",
    gender: "",
    alarm: defaultAlarmIso(),
  });

  const value = useMemo(() => ({ form, setForm }), [form]);

  return (
    <RegisterContext.Provider value={value}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: APP_BACKGROUND },
        }}
      />
    </RegisterContext.Provider>
  );
}
