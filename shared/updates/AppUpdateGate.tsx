import * as Application from "expo-application";
import Constants from "expo-constants";
import * as SplashScreen from "expo-splash-screen";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, AppState, Linking, Platform, View } from "react-native";
import { HardUpdateDialog } from "@/shared/components/modal/HardUpdateModal";
import { useTranslation } from "@/shared/hooks/useTranslation";
import { fetchUpdatePolicy, type RemoteUpdatePolicy } from "./remoteConfigClient";
import { evaluateUpdatePolicy, validateStoreUrl } from "./versionPolicy";

const EMPTY_POLICY: RemoteUpdatePolicy = {
  hardVersion: "", softVersion: "", androidStoreUrl: "", iosStoreUrl: "",
};

// Compare the installed binary, which cannot be replaced by a JavaScript update.
const CURRENT_VERSION = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "";

export function AppUpdateGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [policy, setPolicy] = useState<RemoteUpdatePolicy | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openingStore, setOpeningStore] = useState(false);
  const mounted = useRef(false);
  const fetching = useRef(false);

  const refresh = useCallback(async (forceRefresh = false) => {
    if (fetching.current) return;
    fetching.current = true;
    setRefreshing(true);
    try {
      const next = await fetchUpdatePolicy({ forceRefresh });
      if (mounted.current) setPolicy(next);
    } catch {
      if (mounted.current) setPolicy((previous) => previous ?? EMPTY_POLICY);
    } finally {
      fetching.current = false;
      if (mounted.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, [refresh]);

  useEffect(() => {
    if (policy !== null) void SplashScreen.hideAsync();
  }, [policy]);

  const result = evaluateUpdatePolicy(CURRENT_VERSION, policy ?? EMPTY_POLICY);
  const openStore = async () => {
    if (openingStore) return;
    setOpeningStore(true);
    try {
      const extra = Constants.expoConfig?.extra as
        | { androidStoreUrl?: string; iosStoreUrl?: string }
        | undefined;
      const platform = Platform.OS === "android" ? "android" : "ios";
      const remoteUrl = platform === "android" ? policy?.androidStoreUrl : policy?.iosStoreUrl;
      const bundledUrl = platform === "android" ? extra?.androidStoreUrl : extra?.iosStoreUrl;
      const url = validateStoreUrl(remoteUrl || "", platform) ||
        validateStoreUrl(bundledUrl || "", platform);
      if (!url) throw new Error("STORE_URL_NOT_CONFIGURED");
      await Linking.openURL(url);
    } catch {
      Alert.alert(t("modal.hardUpdate.storeErrorTitle"), t("modal.hardUpdate.storeError"));
    } finally {
      if (mounted.current) setOpeningStore(false);
    }
  };

  if (policy === null) {
    return <View style={{ flex: 1, backgroundColor: "#FFFFFF", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>;
  }

  if (result.status === "hardUpdate") {
    return <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <HardUpdateDialog
        currentVersion={result.currentVersion}
        latestVersion={result.latestVersion}
        onConfirm={() => void openStore()}
        onRecheck={() => void refresh(true)}
        openingStore={openingStore}
        checking={refreshing}
      />
    </View>;
  }

  return children;
}
