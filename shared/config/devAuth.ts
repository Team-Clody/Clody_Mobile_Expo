import { useAppStore } from "@/store/useAppStore";
import { tokenStorage } from "@/shared/storage/tokenStorage";

/** 서버 이슈 시 UI 확인용 — true면 로그인 우회, 배포·정상 개발 시 false */
export const DEV_BYPASS_AUTH = false;

const DEV_ACCESS_TOKEN = "dev-bypass-access-token";
const DEV_REFRESH_TOKEN = "dev-bypass-refresh-token";

export async function enterAppWithDevBypass(): Promise<void> {
  await tokenStorage.saveTokens(DEV_ACCESS_TOKEN, DEV_REFRESH_TOKEN);
  useAppStore.setState({ isLoggedIn: true, authReady: true });
}
