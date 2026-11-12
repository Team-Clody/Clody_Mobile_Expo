import * as Application from "expo-application";
import Constants from "expo-constants";
import * as SplashScreen from "expo-splash-screen";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Linking, Platform, View } from "react-native";
import { HardUpdateDialog } from "@/shared/components/modal/HardUpdateModal";
import { fetchUpdatePolicy, type RemoteUpdatePolicy } from "./remoteConfigClient";
import { evaluateUpdatePolicy, validateStoreUrl } from "./versionPolicy";

const EMPTY_POLICY: RemoteUpdatePolicy = {
  hardVersion: "", softVersion: "", androidStoreUrl: "", iosStoreUrl: "",
};

// Compare the installed binary, which cannot be replaced by a JavaScript update.
const CURRENT_VERSION = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "";

export function AppUpdateGate({ children }: { children: ReactNode }) {
  const [policy, setPolicy] = useState<RemoteUpdatePolicy | null>(null);
  const policyRef = useRef<RemoteUpdatePolicy | null>(null);
  const mounted = useRef(false);
  const fetching = useRef<Promise<boolean> | null>(null);

  const refresh = useCallback((forceRefresh = false): Promise<boolean> => {
    if (fetching.current) return fetching.current;
    const request = (async () => {
      let next: RemoteUpdatePolicy;
      try {
        next = await fetchUpdatePolicy({ forceRefresh });
      } catch {
        next = policyRef.current ?? EMPTY_POLICY;
      }
      if (mounted.current) {
        policyRef.current = next;
        setPolicy(next);
      }
      return evaluateUpdatePolicy(CURRENT_VERSION, next).status === "hardUpdate";
    })().finally(() => {
      if (fetching.current === request) fetching.current = null;
    });
    fetching.current = request;
    return request;
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
  };

  if (policy === null) {
    return <View style={{ flex: 1, backgroundColor: "#FFFFFF", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>;
  }

  if (result.status === "hardUpdate") {
    return <View style={{ flex: 1, backgroundColor: "#FFFFFF", justifyContent: "center" }}>
      <ActivityIndicator />
      <HardUpdateDialog
        currentVersion={result.currentVersion}
        latestVersion={result.latestVersion}
        onConfirm={openStore}
        onRecheck={() => refresh(true)}
      />
    </View>;
  }

  return children;
}
