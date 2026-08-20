import type { SetStateAction } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { tokenStorage } from "@/shared/storage/tokenStorage";

export type AppUser = { id: string; name: string };

type AppState = {
  user: AppUser | null;
  /** SecureStore 등에서 초기 토큰 조회가 끝난 뒤에만 의미 있음 */
  authReady: boolean;
  isLoggedIn: boolean;
};

type AppActions = {
  setUser: (value: SetStateAction<AppUser | null>) => void;
  setIsLoggedIn: (value: SetStateAction<boolean>) => void;
  /** 앱 기동 시 한 번 호출: 저장소 토큰으로 로그인 여부·준비 완료 플래그 설정 */
  hydrateAuthFromStorage: () => Promise<void>;
};

export const useAppStore = create<AppState & AppActions>((set) => ({
  user: null,
  authReady: false,
  isLoggedIn: false,
  setUser: (value) =>
    set((s) => ({
      user:
        typeof value === "function"
          ? (value as (prev: AppUser | null) => AppUser | null)(s.user)
          : value,
    })),
  setIsLoggedIn: (value) =>
    set((s) => ({
      isLoggedIn:
        typeof value === "function"
          ? (value as (prev: boolean) => boolean)(s.isLoggedIn)
          : value,
      // 로그인 결과를 반영했다는 것은 저장소 조회/재발급 등 인증 판별이 끝났다는 뜻이다.
      // 이 값이 갱신되지 않으면 메인 화면이 인증 준비 중으로 판단해 빈 화면을 반환한다.
      authReady: true,
    })),
  hydrateAuthFromStorage: async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      set({ isLoggedIn: Boolean(accessToken) });
    } finally {
      set({ authReady: true });
    }
  },
}));

/** 기존 Context API와 동일한 객체 형태로 구독 (리렌더 최소화용 shallow) */
export function useApp() {
  return useAppStore(
    useShallow((s) => ({
      user: s.user,
      setUser: s.setUser,
      authReady: s.authReady,
      isLoggedIn: s.isLoggedIn,
      setIsLoggedIn: s.setIsLoggedIn,
    })),
  );
}
