import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppContext, type AppUser } from "./app-context";
import { tokenStorage } from "@/shared/storage/tokenStorage";

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await tokenStorage.getAccessToken();
        if (!cancelled) {
          setIsLoggedIn(Boolean(accessToken));
        }
      } finally {
        if (!cancelled) {
          setAuthReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      authReady,
      isLoggedIn,
      setIsLoggedIn,
    }),
    [user, authReady, isLoggedIn],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
