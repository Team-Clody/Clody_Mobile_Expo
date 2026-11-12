const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

const NOTIFICATION_OVERRIDES = {
  "com.google.firebase.messaging.default_notification_channel_id": "android:value",
  "com.google.firebase.messaging.default_notification_color": "android:resource",
};

// Expo supplies the app's values; Firebase also declares defaults in its library
// manifest. Preserve Expo's values when Android merges the two manifests.
module.exports = function withFirebaseNotificationOverrides(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = AndroidConfig.Manifest.ensureToolsAvailable(config.modResults);
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    for (const metadata of application["meta-data"] ?? []) {
      const attributes = metadata.$;
      const replacement = NOTIFICATION_OVERRIDES[attributes["android:name"]];
      if (!replacement || attributes[replacement] === undefined) continue;

      const replacements = new Set(
        (attributes["tools:replace"] ?? "")
          .split(",")
          .map((attribute) => attribute.trim())
          .filter(Boolean),
      );
      replacements.add(replacement);
      attributes["tools:replace"] = [...replacements].join(",");
    }

    config.modResults = manifest;
    return config;
  });
};
