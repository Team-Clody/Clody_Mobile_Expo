import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
  setConfigSettings,
  setDefaults,
} from "@react-native-firebase/remote-config";
import type { RemoteUpdatePolicy, UpdateFetchOptions } from "./remoteConfigClient";
import { validateStoreUrl } from "./versionPolicy";

const DEFAULTS = {
  rn_update_version_hard: "",
  rn_update_version_soft: "",
  app_update_store_url_android: "",
  app_update_store_url_ios: "",
};

const emptyPolicy = (): RemoteUpdatePolicy => ({
  hardVersion: "",
  softVersion: "",
  androidStoreUrl: "",
  iosStoreUrl: "",
});

let pending: Promise<RemoteUpdatePolicy> | null = null;
let lastPolicy = emptyPolicy();

async function waitForRefresh(refresh: Promise<unknown>): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      refresh.catch(() => undefined),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, 5_000);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function readPolicy(forceRefresh: boolean): Promise<RemoteUpdatePolicy> {
  try {
    const config = getRemoteConfig();
    const defaultInterval = __DEV__ ? 0 : 60 * 60 * 1000;
    const refresh = (async () => {
      await setDefaults(config, DEFAULTS);
      await setConfigSettings(config, {
        minimumFetchIntervalMillis: forceRefresh ? 0 : defaultInterval,
        fetchTimeMillis: 5_000,
      });
      try {
        await fetchAndActivate(config);
      } finally {
        if (forceRefresh) {
          // A manual retry can see an urgent policy rollback immediately.
          // Restore the normal fetch interval for other SDK consumers.
          await setConfigSettings(config, {
            minimumFetchIntervalMillis: defaultInterval,
            fetchTimeMillis: 5_000,
          });
        }
      }
    })();
    // Bound the whole native round trip, including SDK initialization. A late
    // fetch may still populate the SDK cache for the next foreground check.
    await waitForRefresh(refresh);

    // An offline or slow launch still applies the last activated policy.
    lastPolicy = {
      hardVersion: getValue(config, "rn_update_version_hard").asString().trim(),
      softVersion: getValue(config, "rn_update_version_soft").asString().trim(),
      androidStoreUrl: validateStoreUrl(
        getValue(config, "app_update_store_url_android").asString(),
        "android",
      ),
      iosStoreUrl: validateStoreUrl(
        getValue(config, "app_update_store_url_ios").asString(),
        "ios",
      ),
    };
  } catch {
    // An unavailable SDK or missing configuration must not prevent startup.
  }
  return lastPolicy;
}

/** Concurrent startup/resume checks share one fetch. No config writes occur. */
export function fetchUpdatePolicy(
  options: UpdateFetchOptions = {},
): Promise<RemoteUpdatePolicy> {
  if (pending) return pending;
  const request = readPolicy(options.forceRefresh === true).finally(() => {
    if (pending === request) pending = null;
  });
  pending = request;
  return request;
}
