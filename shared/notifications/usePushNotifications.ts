import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useRootNavigationState, useRouter, useSegments } from "expo-router";
import { AlarmAPI } from "@/api/alarmAPI";
import { DEV_BYPASS_AUTH } from "@/shared/config/devAuth";
import { useAppStore } from "@/store/useAppStore";
import { getNotificationRoute } from "./notificationRoute";
import {
  clearLastNotificationResponse,
  getFcmToken,
  listenForPushNotifications,
} from "./pushClient";
import type { PushNotification } from "./pushClient";
import { createTokenSync } from "./tokenSync";

export function usePushNotifications() {
  const router = useRouter();
  const segments = useSegments();
  const navigation = useRootNavigationState();
  const authReady = useAppStore((state) => state.authReady);
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  // Stored tokens alone are not enough: wait until startup authentication has
  // navigated into the home stack before registering or opening a notification.
  const homeReady = Boolean(navigation?.key) && authReady && isLoggedIn &&
    segments[0] === "(home)" && !DEV_BYPASS_AUTH;
  const homeReadyRef = useRef(homeReady);
  homeReadyRef.current = homeReady;
  const tokenSync = useRef<ReturnType<typeof createTokenSync> | null>(null);
  const [pending, setPending] = useState<PushNotification | null>(null);
  const handled = useRef(new Set<string>());

  useEffect(() => listenForPushNotifications({
    shouldDisplay: () => homeReadyRef.current,
    onOpen: (notification) => {
      const auth = useAppStore.getState();
      if (auth.authReady && !auth.isLoggedIn) return;
      if (!handled.current.has(notification.id)) setPending(notification);
    },
    onTokenRefresh: (token) => {
      if (homeReadyRef.current) void tokenSync.current?.sync(token);
    },
  }), []);

  useEffect(() => {
    if (authReady && !isLoggedIn) {
      tokenSync.current?.stop();
      setPending(null);
      void clearLastNotificationResponse().catch(() => {});
    }
  }, [authReady, isLoggedIn]);

  useEffect(() => {
    if (!homeReady) return;
    const sync = createTokenSync(
      async (token, signal) => {
        await AlarmAPI.updateFcmToken(token, signal);
        if (__DEV__ && !signal.aborted) {
          console.info("[Push] FCM token synchronized.");
        }
      },
      () => console.warn("[Push] Token sync failed; retrying on the next app activation."),
    );
    tokenSync.current = sync;
    let active = true;
    const refresh = async () => {
      const token = await getFcmToken({ requestPermission: true });
      if (active && token) await sync.sync(token);
    };
    void refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      active = false;
      subscription.remove();
      sync.stop();
      if (tokenSync.current === sync) tokenSync.current = null;
    };
  }, [homeReady]);

  useEffect(() => {
    if (!homeReady || !pending) return;
    if (!handled.current.has(pending.id)) {
      // Both native initial-open and local response listeners may report a tap.
      handled.current.add(pending.id);
      if (handled.current.size > 100) {
        const first = handled.current.values().next().value;
        if (first !== undefined) handled.current.delete(first);
      }
      router.push(getNotificationRoute(pending.data));
    }
    setPending(null);
    void clearLastNotificationResponse().catch(() => {});
  }, [homeReady, pending, router]);
}
