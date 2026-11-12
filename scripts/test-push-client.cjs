// Exercise the native push client with mocked platform boundaries; no device or network needed.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.dirname(require.resolve("../package.json"));
const filename = path.join(root, "shared/notifications/pushClient.native.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  fileName: filename,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function settle() {
  for (let index = 0; index < 10; index += 1) await Promise.resolve();
}

class Clock {
  now = 0;
  timers = new Map();
  nextId = 1;

  setTimeout = (callback, delay) => {
    const id = this.nextId++;
    this.timers.set(id, { callback, at: this.now + delay });
    return id;
  };

  clearTimeout = (id) => { this.timers.delete(id); };

  async advance(milliseconds) {
    const end = this.now + milliseconds;
    for (;;) {
      const next = [...this.timers].filter(([, timer]) => timer.at <= end)
        .sort((left, right) => left[1].at - right[1].at)[0];
      if (!next) break;
      this.now = next[1].at;
      this.timers.delete(next[0]);
      next[1].callback();
      await settle();
    }
    this.now = end;
    await settle();
  }
}

function environment(options = {}) {
  const clock = new Clock();
  const calls = [];
  const schedules = [];
  const removed = [];
  const handlers = {};
  const warnings = [];
  const messaging = { isDeviceRegisteredForRemoteMessages: options.registered ?? false };
  const authorized = { status: "granted", granted: true, canAskAgain: true };
  const denied = { status: "denied", granted: false, canAskAgain: true };
  const notifications = {
    AndroidImportance: { HIGH: 4 },
    IosAuthorizationStatus: { PROVISIONAL: 3, EPHEMERAL: 4 },
    DEFAULT_ACTION_IDENTIFIER: "default-action",
    async setNotificationChannelAsync(id, channel) {
      calls.push("channel");
      assert.equal(id, "default");
      assert.equal(channel.importance, 4);
    },
    async getPermissionsAsync() {
      calls.push("getPermissions");
      return options.permission ?? authorized;
    },
    async requestPermissionsAsync() {
      calls.push("requestPermissions");
      return options.requestedPermission ?? authorized;
    },
    async dismissAllNotificationsAsync() { calls.push("dismiss"); },
    async clearLastNotificationResponseAsync() { calls.push("clearResponse"); },
    setNotificationHandler(handler) { handlers.presentation = handler; },
    async scheduleNotificationAsync(notification) { schedules.push(notification); },
    addNotificationResponseReceivedListener(callback) {
      handlers.localOpen = callback;
      return { remove: () => { removed.push("localOpen"); } };
    },
    getLastNotificationResponseAsync() {
      return options.lastResponse ?? Promise.resolve(null);
    },
  };
  const firebase = {
    getMessaging() { calls.push("getMessaging"); return messaging; },
    async registerDeviceForRemoteMessages(instance) {
      assert.equal(instance, messaging);
      calls.push("registerAPNs");
      messaging.isDeviceRegisteredForRemoteMessages = true;
    },
    async getAPNSToken() { calls.push("getAPNsToken"); return options.apnsToken ?? "apns-token"; },
    async getToken() {
      calls.push("getFcmToken");
      return options.token ? options.token() : "fcm-registration-token";
    },
    async deleteToken() {
      calls.push("deleteToken");
      return options.deleteToken?.();
    },
    async getIsHeadless() {
      calls.push("getIsHeadless");
      if (options.headlessError) throw options.headlessError;
      return options.headless ?? false;
    },
    getInitialNotification() { return options.initialNotification ?? Promise.resolve(null); },
  };
  for (const [method, key] of [
    ["onTokenRefresh", "refresh"], ["onMessage", "message"], ["onNotificationOpenedApp", "remoteOpen"],
  ]) {
    firebase[method] = (instance, callback) => {
      assert.equal(instance, messaging);
      handlers[key] = callback;
      return () => { removed.push(key); };
    };
  }
  const modules = {
    "@react-native-firebase/messaging": firebase,
    "expo-constants": {
      default: { executionEnvironment: options.expoGo ? "store-client" : "standalone" },
      ExecutionEnvironment: { StoreClient: "store-client" },
    },
    "expo-device": { isDevice: options.device ?? true },
    "expo-notifications": notifications,
    "react-native": { Platform: { OS: options.os ?? "android" } },
  };
  const loaded = { exports: {} };
  new Function("require", "exports", "console", "setTimeout", "clearTimeout", compiled)((name) => {
    assert.ok(name in modules, `Unexpected native import ${name}`);
    return modules[name];
  }, loaded.exports, { warn: (...args) => { warnings.push(args); } }, clock.setTimeout, clock.clearTimeout);
  const opens = [];
  const refreshedTokens = [];
  let display = true;
  const listeners = {
    onOpen: (notification) => { opens.push(notification); },
    onTokenRefresh: (token) => { refreshedTokens.push(token); },
    shouldDisplay: () => display,
  };
  return {
    client: loaded.exports, clock, calls, schedules, removed, handlers, opens, refreshedTokens, warnings,
    listeners, denied, hide: () => { display = false; },
  };
}

function localResponse(id, data = {}, actionIdentifier = "default-action") {
  return {
    actionIdentifier,
    notification: { request: { identifier: id, content: { data } } },
  };
}

test("iOS obtains an FCM token after APNs registration rather than returning the APNs token", async () => {
  const env = environment({ os: "ios" });
  assert.equal(await env.client.getFcmToken(), "fcm-registration-token");
  assert.ok(env.calls.indexOf("registerAPNs") < env.calls.indexOf("getAPNsToken"));
  assert.ok(env.calls.indexOf("getAPNsToken") < env.calls.indexOf("getFcmToken"));
  assert.equal(env.calls.includes("channel"), false);
});

test("iOS waits for APNs readiness before requesting the FCM token", async () => {
  const env = environment({ os: "ios", apnsToken: "" });
  assert.equal(await env.client.getFcmToken(), null);
  assert.equal(env.calls.includes("getFcmToken"), false);
});

test("Android creates its notification channel before prompting for permission", async () => {
  const env = environment({ permission: { status: "undetermined", granted: false, canAskAgain: true } });
  assert.equal(await env.client.getFcmToken({ requestPermission: true }), "fcm-registration-token");
  assert.ok(env.calls.indexOf("channel") < env.calls.indexOf("requestPermissions"));
});

test("denied permission returns null and never asks Firebase for a token", async () => {
  const env = environment({
    permission: { status: "undetermined", granted: false, canAskAgain: true },
    requestedPermission: { status: "denied", granted: false, canAskAgain: false },
  });
  assert.equal(await env.client.getFcmToken({ requestPermission: true }), null);
  assert.equal(env.calls.includes("getFcmToken"), false);
  const backgroundCheck = environment({ permission: { status: "undetermined", granted: false, canAskAgain: true } });
  assert.equal(await backgroundCheck.client.getFcmToken(), null);
  assert.equal(backgroundCheck.calls.includes("requestPermissions"), false);
});

test("previous permission denial is respected even when Android can ask again", async () => {
  const env = environment({ permission: { status: "denied", granted: false, canAskAgain: true } });
  assert.equal(await env.client.getFcmToken({ requestPermission: true }), null);
  assert.equal(env.calls.includes("requestPermissions"), false);
  assert.equal(env.calls.includes("getFcmToken"), false);
});

test("provisional iOS notification authorization can register with FCM", async () => {
  const env = environment({ os: "ios", permission: { status: "granted", granted: false, canAskAgain: true, ios: { status: 3 } } });
  assert.equal(await env.client.getFcmToken(), "fcm-registration-token");
});

test("Android emulators and Expo Go leave native notification services untouched", async () => {
  for (const options of [{ device: false }, { expoGo: true }, { os: "ios", device: false, expoGo: true }]) {
    const env = environment(options);
    assert.equal(await env.client.getFcmToken({ requestPermission: true }), null);
    await env.client.clearPushToken();
    env.client.listenForPushNotifications(env.listeners)();
    assert.deepEqual(env.calls, []);
    assert.deepEqual(env.handlers, {});
  }
});

test("iOS simulators can request permission and register only after an APNs token is ready", async () => {
  const permission = { status: "undetermined", granted: false, canAskAgain: true };
  const supported = environment({ os: "ios", device: false, permission });
  assert.equal(await supported.client.getFcmToken({ requestPermission: true }), "fcm-registration-token");
  assert.ok(supported.calls.indexOf("requestPermissions") < supported.calls.indexOf("registerAPNs"));
  assert.ok(supported.calls.indexOf("getAPNsToken") < supported.calls.indexOf("getFcmToken"));

  const unavailable = environment({ os: "ios", device: false, apnsToken: "" });
  assert.equal(await unavailable.client.getFcmToken({ requestPermission: true }), null);
  assert.equal(unavailable.calls.includes("getFcmToken"), false);
});

test("iOS simulators deliver injected remote opens through the same listener path", async () => {
  const env = environment({ os: "ios", device: false });
  const stop = env.client.listenForPushNotifications(env.listeners);
  env.handlers.remoteOpen({ messageId: "simulated-push", data: { type: "diary_reminder" } });
  assert.deepEqual(env.opens, [{ id: "simulated-push", data: { type: "diary_reminder" } }]);
  stop();
  assert.deepEqual(env.removed.sort(), ["localOpen", "message", "refresh", "remoteOpen"]);
});

test("simultaneous callers share a single permission prompt and token registration", async () => {
  const token = deferred();
  const env = environment({ permission: { status: "undetermined", granted: false, canAskAgain: true }, token: () => token.promise });
  const first = env.client.getFcmToken({ requestPermission: true });
  const second = env.client.getFcmToken({ requestPermission: true });
  await settle();
  assert.equal(env.calls.filter((call) => call === "getFcmToken").length, 1);
  assert.equal(env.calls.filter((call) => call === "requestPermissions").length, 1);
  token.resolve("shared-fcm-token");
  assert.deepEqual(await Promise.all([first, second]), ["shared-fcm-token", "shared-fcm-token"]);
});

test("all concurrent callers receive null on registration failure and a later call retries", async () => {
  const token = deferred();
  let attempts = 0;
  const env = environment({ token: () => ++attempts === 1 ? token.promise : "recovered-token" });
  const callers = [env.client.getFcmToken(), env.client.getFcmToken()];
  await settle();
  token.reject(new Error("registration unavailable"));
  const results = await Promise.allSettled(callers);
  assert.deepEqual(results, [{ status: "fulfilled", value: null }, { status: "fulfilled", value: null }]);
  assert.equal(await env.client.getFcmToken(), "recovered-token");
});

test("logout invalidates a token request already in flight and removes delivered notifications", async () => {
  const token = deferred();
  const env = environment({ token: () => token.promise });
  const request = env.client.getFcmToken();
  await settle();
  const clear = env.client.clearPushToken();
  token.resolve("stale-after-logout");
  assert.equal(await request, null);
  await clear;
  assert.ok(env.calls.includes("deleteToken"));
  assert.ok(env.calls.includes("dismiss"));
  assert.ok(env.calls.includes("clearResponse"));
});

test("registration returns null at ten seconds while retaining the shared native request", async () => {
  const token = deferred();
  const env = environment({ token: () => token.promise });
  let settled = false;
  const request = env.client.getFcmToken().then((value) => { settled = true; return value; });
  await settle();
  await env.clock.advance(9_999);
  assert.equal(settled, false);
  await env.clock.advance(1);
  assert.equal(await request, null);

  const second = env.client.getFcmToken();
  await settle();
  assert.equal(env.calls.filter((call) => call === "getFcmToken").length, 1);
  token.resolve("late-shared-token");
  assert.equal(await second, "late-shared-token");
  await settle();
  assert.equal(env.clock.timers.size, 0);
});

test("a timed-out registration cannot return its late token after logout", async () => {
  const token = deferred();
  const env = environment({ token: () => token.promise });
  const request = env.client.getFcmToken();
  await settle();
  await env.clock.advance(10_000);
  assert.equal(await request, null);
  const cleanup = env.client.clearPushToken();
  token.resolve("expired-session-token");
  await cleanup;
  assert.ok(env.calls.filter((call) => call === "deleteToken").length >= 1);
  assert.ok(env.calls.includes("dismiss"));
  assert.ok(env.calls.includes("clearResponse"));
});

test("relogin waits for old-session token deletion before registering its new token", async () => {
  const deletion = deferred();
  let issued = 0;
  const env = environment({
    token: () => ++issued === 1 ? "old-session-token" : "new-session-token",
    deleteToken: () => deletion.promise,
  });
  assert.equal(await env.client.getFcmToken(), "old-session-token");
  const cleanup = env.client.clearPushToken();
  await settle();
  assert.ok(env.calls.includes("deleteToken"));
  let reloginSettled = false;
  const relogin = env.client.getFcmToken().then((value) => { reloginSettled = true; return value; });
  await settle();
  assert.equal(reloginSettled, false);
  assert.equal(issued, 1);
  deletion.resolve();
  await cleanup;
  assert.equal(await relogin, "new-session-token");
  assert.equal(issued, 2);
  assert.equal(env.calls.filter((call) => call === "deleteToken").length, 1);
});

test("iOS identifies headless launches and treats normal launches or native failures as foreground", async () => {
  const headless = environment({ os: "ios", headless: true });
  assert.equal(await headless.client.isBackgroundPushLaunch(), true);
  assert.ok(headless.calls.includes("getIsHeadless"));
  const normal = environment({ os: "ios", headless: false });
  assert.equal(await normal.client.isBackgroundPushLaunch(), false);
  const failed = environment({ os: "ios", headlessError: new Error("native lookup failed") });
  assert.equal(await failed.client.isBackgroundPushLaunch(), false);
  const simulator = environment({ os: "ios", device: false, headless: true });
  assert.equal(await simulator.client.isBackgroundPushLaunch(), true);
  assert.ok(simulator.calls.includes("getIsHeadless"));
});

test("Android and unsupported devices skip native headless launch detection", async () => {
  for (const options of [{ os: "android", headless: true }, { os: "ios", expoGo: true }]) {
    const env = environment(options);
    assert.equal(await env.client.isBackgroundPushLaunch(), false);
    assert.deepEqual(env.calls, []);
  }
});

test("Android foreground notifications retain message identity and data in their local copy", async () => {
  const env = environment();
  const stop = env.client.listenForPushNotifications(env.listeners);
  await env.handlers.message({
    messageId: "message-1", notification: { title: "Reply ready", body: "Open your reply" },
    data: { type: "reply", date: "2026-11-12" },
  });
  assert.deepEqual(env.schedules, [{
    identifier: "clody-fcm-message-1",
    content: { title: "Reply ready", body: "Open your reply", data: { type: "reply", date: "2026-11-12" }, sound: "default" },
    trigger: { channelId: "default" },
  }]);
  env.hide();
  await env.handlers.message({ messageId: "hidden", notification: { title: "Hidden" } });
  assert.equal(env.schedules.length, 1);
  stop();
});

test("data-only messages do not create visible foreground notifications", async () => {
  const env = environment();
  const stop = env.client.listenForPushNotifications(env.listeners);
  await env.handlers.message({ messageId: "data-only", data: { type: "reply" } });
  assert.deepEqual(env.schedules, []);
  stop();
});

test("iOS foreground messages use native presentation without creating local duplicates", async () => {
  const env = environment({ os: "ios" });
  const stop = env.client.listenForPushNotifications(env.listeners);
  await env.handlers.message?.({ messageId: "ios-message", notification: { title: "Reply" } });
  assert.deepEqual(env.schedules, []);
  stop();
});

test("cold-start remote notifications and Expo foreground-copy taps are forwarded once per event", async () => {
  const env = environment({
    initialNotification: Promise.resolve({ messageId: "remote", data: { type: "reply", date: "2026-11-12" } }),
    lastResponse: Promise.resolve(localResponse("clody-fcm-local", { type: "diary" })),
  });
  const stop = env.client.listenForPushNotifications(env.listeners);
  await settle();
  assert.deepEqual(env.opens, [
    { id: "remote", data: { type: "reply", date: "2026-11-12" } },
    { id: "local", data: { type: "diary" } },
  ]);
  env.handlers.localOpen(localResponse("remote-copy"));
  env.handlers.localOpen(localResponse("clody-fcm-ignored", {}, "custom-action"));
  assert.equal(env.opens.length, 2);
  env.handlers.remoteOpen({ messageId: "background", data: { type: "diary" } });
  env.handlers.localOpen(localResponse("clody-fcm-foreground", { type: "diary_reminder" }));
  assert.deepEqual(env.opens.slice(2), [
    { id: "background", data: { type: "diary" } },
    { id: "foreground", data: { type: "diary_reminder" } },
  ]);
  stop();
});

test("listener cleanup detaches subscriptions and ignores late native events or initial responses", async () => {
  const initial = deferred();
  const last = deferred();
  const env = environment({ initialNotification: initial.promise, lastResponse: last.promise });
  const stop = env.client.listenForPushNotifications(env.listeners);
  env.handlers.refresh("new-token");
  assert.deepEqual(env.refreshedTokens, ["new-token"]);
  stop();
  assert.deepEqual(env.removed.sort(), ["localOpen", "message", "refresh", "remoteOpen"]);
  assert.equal(env.handlers.presentation, null);
  env.handlers.refresh("late-token");
  env.handlers.remoteOpen({ messageId: "late-remote" });
  env.handlers.localOpen(localResponse("clody-fcm-late-local"));
  await env.handlers.message({ messageId: "late-message", notification: { title: "Late" } });
  initial.resolve({ messageId: "late-initial" });
  last.resolve(localResponse("clody-fcm-late-last"));
  await settle();
  assert.deepEqual(env.refreshedTokens, ["new-token"]);
  assert.deepEqual(env.opens, []);
  assert.deepEqual(env.schedules, []);
});
