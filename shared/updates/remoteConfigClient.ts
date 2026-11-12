import type { UpdateVersionPolicy } from "./versionPolicy";

export interface RemoteUpdatePolicy extends UpdateVersionPolicy {
  androidStoreUrl: string;
  iosStoreUrl: string;
}

export interface UpdateFetchOptions {
  forceRefresh?: boolean;
}

// Web does not have a native app store or a native Firebase Remote Config client.
export async function fetchUpdatePolicy(
  _options: UpdateFetchOptions = {},
): Promise<RemoteUpdatePolicy> {
  return { hardVersion: "", softVersion: "", androidStoreUrl: "", iosStoreUrl: "" };
}
