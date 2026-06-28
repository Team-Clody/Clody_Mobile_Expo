import { useAppStore } from "@/store/useAppStore";
import { tokenStorage } from "@/shared/storage/tokenStorage";

/** 서버 장애 시 UI 확인용 — 확인 후 false로 변경 */
export const DEV_BYPASS_AUTH = true;

const DEV_ACCESS_TOKEN = "dev-bypass-access-token";
const DEV_REFRESH_TOKEN = "dev-bypass-refresh-token";

export async function enterAppWithDevBypass(): Promise<void> {
  await tokenStorage.saveTokens(DEV_ACCESS_TOKEN, DEV_REFRESH_TOKEN);
  useAppStore.setState({ isLoggedIn: true, authReady: true });
}
