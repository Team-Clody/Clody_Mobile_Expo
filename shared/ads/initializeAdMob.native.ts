import mobileAds from "react-native-google-mobile-ads";

let initializePromise: Promise<unknown> | null = null;

export function initializeAdMob() {
  if (!initializePromise) {
    initializePromise = mobileAds()
      .initialize()
      .catch((error) => {
        initializePromise = null;
        throw error;
      });
  }

  return initializePromise;
}
