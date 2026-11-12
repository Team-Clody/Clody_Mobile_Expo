const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

const NOTIFICATION_OVERRIDES = {
  "com.google.firebase.messaging.default_notification_channel_id": "android:value",
  "com.google.firebase.messaging.default_notification_color": "android:resource",
};

// Expo supplies the app's values; Firebase also declares defaults in its library
// manifest. Preserve Expo's values when Android merges the two manifests.
module.exports = function withFirebaseNotificationOverrides(config) {
  const notificationPlugin = (config.plugins ?? []).find(
    (plugin) => Array.isArray(plugin) && plugin[0] === "expo-notifications",
  );
  const notificationOptions = notificationPlugin?.[1] ?? {};
  const configuredValues = {
    "com.google.firebase.messaging.default_notification_channel_id":
      notificationOptions.defaultChannel,
    "com.google.firebase.messaging.default_notification_color":
      notificationOptions.color || config.notification?.color
        ? "@color/notification_icon_color"
        : undefined,
  };

  return withAndroidManifest(config, (config) => {
    const manifest = AndroidConfig.Manifest.ensureToolsAvailable(config.modResults);
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    application["meta-data"] ??= [];
    for (const [name, replacement] of Object.entries(NOTIFICATION_OVERRIDES)) {
      let metadata = application["meta-data"].find(
        (item) => item.$["android:name"] === name,
      );
      // Mods run in reverse registration order. On a fresh prebuild Expo has
      // not added these rows yet; seed its configured values so the merge
      // marker survives Expo's later metadata updates as well.
      if (!metadata && configuredValues[name]) {
        metadata = { $: { "android:name": name, [replacement]: configuredValues[name] } };
        application["meta-data"].push(metadata);
      }
      if (!metadata) continue;
      const attributes = metadata.$;
      if (attributes[replacement] === undefined) continue;

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
