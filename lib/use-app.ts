import { useContext } from "react";
import { AppContext, type AppContextValue } from "./app-context";

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (ctx == null) {
    throw new Error("useApp must be used within AppContext.Provider");
  }
  return ctx;
}
