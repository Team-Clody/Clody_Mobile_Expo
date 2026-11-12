const assert = require("node:assert/strict");
const test = require("node:test");
const { withNotificationManifest } = require("expo-notifications/plugin/build/withNotificationsAndroid");
const withOverrides = require("../plugins/withFirebaseNotificationOverrides");

const CHANNEL = "com.google.firebase.messaging.default_notification_channel_id";
const COLOR = "com.google.firebase.messaging.default_notification_color";

async function applyOverrides(manifest, options, legacyNotification, includeExpo = false) {
  let config = {
    plugins: options ? [["expo-notifications", options]] : [],
    notification: legacyNotification,
  };
  if (includeExpo) config = withNotificationManifest(config, options ?? {});
  config = withOverrides(config);
  return (await config.mods.android.manifest({ ...config, modResults: manifest, modRequest: {} })).modResults;
}

function emptyManifest(metadata) {
  return {
    manifest: {
      $: { "xmlns:android": "http://schemas.android.com/apk/res/android" },
      application: [{ $: { "android:name": ".MainApplication" }, ...(metadata ? { "meta-data": metadata } : {}) }],
    },
  };
}

function metadata(manifest, name) {
  return manifest.manifest.application[0]["meta-data"].find((item) => item.$["android:name"] === name)?.$;
}

test("fresh prebuild retains override markers when Expo creates notification metadata later", async () => {
  const options = { defaultChannel: "default", color: "#8FF76F" };
  const manifest = await applyOverrides(emptyManifest(), options, undefined, true);
  assert.equal(manifest.manifest.$["xmlns:tools"], "http://schemas.android.com/tools");
  assert.equal(metadata(manifest, CHANNEL)["android:value"], "default");
  assert.equal(metadata(manifest, CHANNEL)["tools:replace"], "android:value");
  assert.equal(metadata(manifest, COLOR)["android:resource"], "@color/notification_icon_color");
  assert.equal(metadata(manifest, COLOR)["tools:replace"], "android:resource");
});

test("existing values and override attributes are preserved without duplicate markers", async () => {
  let manifest = emptyManifest([{ $: {
    "android:name": CHANNEL,
    "android:value": "existing",
    "tools:replace": "android:theme, android:value",
  } }]);
  manifest = await applyOverrides(manifest);
  manifest = await applyOverrides(manifest);
  assert.equal(metadata(manifest, CHANNEL)["android:value"], "existing");
  assert.equal(metadata(manifest, CHANNEL)["tools:replace"], "android:theme,android:value");
});

test("unset notification options do not introduce incomplete metadata or missing resources", async () => {
  const manifest = await applyOverrides(emptyManifest());
  assert.deepEqual(manifest.manifest.application[0]["meta-data"], []);
  const channelOnly = await applyOverrides(emptyManifest(), { defaultChannel: "diary" });
  assert.equal(metadata(channelOnly, CHANNEL)["android:value"], "diary");
  assert.equal(metadata(channelOnly, COLOR), undefined);
});

test("the legacy Expo notification color fallback is also prepared before Expo's mod", async () => {
  const manifest = await applyOverrides(emptyManifest(), {}, { color: "#8FF76F" }, true);
  assert.equal(metadata(manifest, COLOR)["tools:replace"], "android:resource");
  assert.equal(metadata(manifest, CHANNEL), undefined);
});
