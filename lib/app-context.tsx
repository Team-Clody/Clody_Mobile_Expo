import {
  createContext,
  type Dispatch,
  type SetStateAction,
} from "react";

export type AppUser = { id: string; name: string };

export type AppContextValue = {
  user: AppUser | null;
  setUser: Dispatch<SetStateAction<AppUser | null>>;
  /** SecureStore 등에서 초기 토큰 조회가 끝난 뒤에만 의미 있음 */
  authReady: boolean;
  isLoggedIn: boolean;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
};

export const AppContext = createContext<AppContextValue | null>(null);
