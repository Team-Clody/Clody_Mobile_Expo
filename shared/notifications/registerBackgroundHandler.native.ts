import { getMessaging, setBackgroundMessageHandler } from "@react-native-firebase/messaging";
import Constants, { ExecutionEnvironment } from "expo-constants";

if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  try {
    // The OS displays notification payloads in the background. Do not show a
    // second local copy or navigate until the user taps the notification.
    setBackgroundMessageHandler(getMessaging(), async () => {});
  } catch {
    console.warn("[Push] Background messaging requires a Firebase-enabled native build.");
  }
}
