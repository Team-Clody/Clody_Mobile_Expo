export type PushNotification = {
  id: string;
  data: Record<string, unknown>;
};

export type PushListeners = {
  onOpen: (notification: PushNotification) => void;
  onTokenRefresh: (token: string) => void;
  shouldDisplay: () => boolean;
};

// Web does not register a device with FCM.
export async function getFcmToken(_options?: {
  requestPermission?: boolean;
}): Promise<string | null> {
  return null;
}

export async function clearPushToken(): Promise<void> {}

export function listenForPushNotifications(_listeners: PushListeners): () => void {
  return () => {};
}

export async function clearLastNotificationResponse(): Promise<void> {}

export async function isBackgroundPushLaunch(): Promise<boolean> {
  return false;
}
