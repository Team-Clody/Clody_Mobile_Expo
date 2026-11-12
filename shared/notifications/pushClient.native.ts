import {
  deleteToken,
  getAPNSToken,
  getMessaging,
  getIsHeadless,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
} from "@react-native-firebase/messaging";
import type { FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { PushListeners, PushNotification } from "./pushClient";

export type { PushListeners, PushNotification } from "./pushClient";

const CHANNEL_ID = "default";
const LOCAL_PREFIX = "clody-fcm-";
let tokenRequest: Promise<string | null> | null = null;
let tokenCleanup: Promise<void> | null = null;
let tokenGeneration = 0;

// Native registration can wait on the network. Authentication must still finish.
function registrationDeadline(request: Promise<string | null>): Promise<string | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 10_000);
    void request.then(resolve, () => resolve(null)).finally(() => clearTimeout(timer));
  });
}

function isSupported() {
  // iOS Simulator supports notification UI and injected remote notifications;
  // modern ARM64 runtimes may also provide a sandbox APNs token. APNs readiness
  // is checked below before requesting an FCM token.
  return (Device.isDevice || Platform.OS === "ios") &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

function hasPermission(permission: Notifications.NotificationPermissionsStatus) {
  return permission.granted ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL;
}

async function prepareChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Clody",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  });
}

/** Always returns an FCM registration token, including on iOS. */
export async function getFcmToken(
  options: { requestPermission?: boolean } = {},
): Promise<string | null> {
  if (!isSupported()) return null;
  // Do not re-register while an older session's token is still being deleted.
  if (tokenCleanup) {
    return registrationDeadline(tokenCleanup.then(() => getFcmToken(options)));
  }
  // Serialize concurrent login / app-resume requests and permission prompts.
  if (tokenRequest) return registrationDeadline(tokenRequest);
  const generation = tokenGeneration;
  const request = (async () => {
    await prepareChannel();
    let permission = await Notifications.getPermissionsAsync();
    if (!hasPermission(permission) && permission.status === "undetermined" &&
        permission.canAskAgain && options.requestPermission) {
      permission = await Notifications.requestPermissionsAsync();
    }
    if (!hasPermission(permission)) return null;

    const messaging = getMessaging();
    if (Platform.OS === "ios") {
      if (!messaging.isDeviceRegisteredForRemoteMessages) {
        await registerDeviceForRemoteMessages(messaging);
      }
      // APNs registration may still be pending; retry on the next app activation.
      if (!(await getAPNSToken(messaging))) return null;
    }
    const token = await getToken(messaging);
    if (generation !== tokenGeneration) {
      await deleteToken(messaging);
      return null;
    }
    return token;
  })().catch(() => {
    console.warn("[Push] FCM registration failed; retrying on the next app activation.");
    return null;
  });
  tokenRequest = request;
  void request.finally(() => {
    if (tokenRequest === request) tokenRequest = null;
  });
  return registrationDeadline(request);
}

export async function clearLastNotificationResponse(): Promise<void> {
  if (isSupported()) await Notifications.clearLastNotificationResponseAsync();
}

export async function isBackgroundPushLaunch(): Promise<boolean> {
  if (Platform.OS !== "ios" || !isSupported()) return false;
  try {
    return await getIsHeadless(getMessaging());
  } catch {
    return false;
  }
}

/** Invalidate the server's old device token without changing alarm preferences. */
export async function clearPushToken(): Promise<void> {
  tokenGeneration += 1;
  if (!isSupported()) return;
  if (tokenCleanup) return tokenCleanup;
  const cleanup = (async () => {
    // Let concurrent registration settle; newer sessions wait for this cleanup.
    await tokenRequest;
    await Promise.allSettled([
      deleteToken(getMessaging()),
      Notifications.dismissAllNotificationsAsync(),
      clearLastNotificationResponse(),
    ]);
  })();
  tokenCleanup = cleanup.finally(() => { tokenCleanup = null; });
  return tokenCleanup;
}

function fromRemote(message: FirebaseMessagingTypes.RemoteMessage): PushNotification {
  return {
    id: message.messageId ?? JSON.stringify([message.sentTime, message.data, message.notification]),
    data: message.data ?? {},
  };
}

export function listenForPushNotifications(listeners: PushListeners): () => void {
  if (!isSupported()) return () => {};
  let active = true;
  const cleanups: (() => void)[] = [];
  const openRemote = (message: FirebaseMessagingTypes.RemoteMessage) => {
    if (active) listeners.onOpen(fromRemote(message));
  };
  const openLocal = (response: Notifications.NotificationResponse) => {
    if (!active || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const request = response.notification.request;
    // Remote notifications are opened by Firebase; Expo owns our foreground copies.
    if (!request.identifier.startsWith(LOCAL_PREFIX)) return;
    listeners.onOpen({
      id: request.identifier.slice(LOCAL_PREFIX.length),
      data: request.content.data,
    });
  };

  try {
    const messaging = getMessaging();
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const show = active && listeners.shouldDisplay() &&
          notification.request.identifier.startsWith(LOCAL_PREFIX);
        return {
          shouldShowBanner: show,
          shouldShowList: show,
          shouldPlaySound: show,
          shouldSetBadge: false,
        };
      },
    });
    cleanups.push(onTokenRefresh(messaging, (token) => {
      if (active) listeners.onTokenRefresh(token);
    }));
    cleanups.push(onNotificationOpenedApp(messaging, openRemote));
    cleanups.push(onMessage(messaging, async (message) => {
      // iOS presents the original remote notification using firebase.json.
      // Keeping its display native avoids competing UNUserNotificationCenter delegates.
      if (Platform.OS === "ios") return;
      if (!active || !listeners.shouldDisplay() || !message.notification) return;
      const notification = fromRemote(message);
      try {
        await prepareChannel();
        if (!active || !listeners.shouldDisplay()) return;
        await Notifications.scheduleNotificationAsync({
          identifier: LOCAL_PREFIX + notification.id,
          content: {
            title: message.notification.title,
            body: message.notification.body,
            data: notification.data,
            sound: "default",
          },
          trigger: Platform.OS === "android" ? { channelId: CHANNEL_ID } : null,
        });
      } catch {
        console.warn("[Push] Could not display the foreground notification.");
      }
    }));
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(openLocal);
    cleanups.push(() => responseSubscription.remove());
    void getInitialNotification(messaging).then((message) => {
      if (message) openRemote(message);
    }).catch(() => {});
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openLocal(response);
    }).catch(() => {});
  } catch {
    console.warn("[Push] Firebase is unavailable; rebuild with the Firebase configuration.");
  }

  return () => {
    active = false;
    cleanups.forEach((cleanup) => cleanup());
    Notifications.setNotificationHandler(null);
  };
}
