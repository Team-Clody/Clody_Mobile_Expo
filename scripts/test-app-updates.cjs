// Offline update policy and native Remote Config boundary regressions.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.dirname(require.resolve("../package.json"));
function loadSource(relativeFilename, modules = {}, dev = false, timers = { setTimeout, clearTimeout }) {
  const filename = path.join(root, relativeFilename);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const loaded = { exports: {} };
  new Function("exports", "require", "__DEV__", "setTimeout", "clearTimeout", compiled.outputText)(
    loaded.exports,
    (id) => {
      if (!(id in modules)) throw new Error(`Unexpected import: ${id}`);
      return modules[id];
    },
    dev,
    timers.setTimeout,
    timers.clearTimeout,
  );
  return loaded.exports;
}

const policy = loadSource("shared/updates/versionPolicy.ts");
const { compareAppVersions, evaluateUpdatePolicy, validateStoreUrl } = policy;

test("release versions compare numerically, including large identifiers", () => {
  assert.equal(compareAppVersions("2.9.0", "2.10.0"), -1);
  assert.equal(compareAppVersions("10.0.0", "9.99.99"), 1);
  assert.equal(compareAppVersions("2.0.1", "2.0.1"), 0);
  assert.equal(compareAppVersions("9007199254740992.0.0", "9007199254740993.0.0"), -1);
  assert.equal(compareAppVersions(" 2.0.1 ", "2.0.1"), 0);
});

test("prerelease ordering follows SemVer and build metadata does not affect precedence", () => {
  const ordered = ["alpha", "alpha.1", "alpha.beta", "beta", "beta.2", "beta.11", "rc.1"];
  for (let index = 0; index < ordered.length - 1; index += 1) {
    assert.equal(compareAppVersions(`2.0.0-${ordered[index]}`, `2.0.0-${ordered[index + 1]}`), -1);
  }
  assert.equal(compareAppVersions("2.0.0-rc.1", "2.0.0"), -1);
  assert.equal(compareAppVersions("2.0.0", "2.0.0-rc.1"), 1);
  assert.equal(compareAppVersions("2.0.0+build.1", "2.0.0+build.2"), 0);
});

test("malformed version strings cannot acquire an ordering", () => {
  for (const value of ["", "latest", "2", "2.0", "v2.0.0", "2.0.0.1", "02.0.0", "2.00.0", "2.0.-1", "2.0.0-beta.01", "2.0.0-", "2.0.0+", "2.0.0\nextra", "x".repeat(257)]) {
    assert.equal(compareAppVersions(value, "2.0.0"), null, value);
    assert.equal(compareAppVersions("2.0.0", value), null, value);
  }
});

test("hard update wins when both thresholds require an update", () => {
  assert.deepEqual(evaluateUpdatePolicy("2.0.1", { hardVersion: "2.1.0", softVersion: "2.2.0" }), {
    status: "hardUpdate", currentVersion: "2.0.1", latestVersion: "2.1.0",
  });
});

test("hard policy works independently of a missing or malformed soft version", () => {
  for (const softVersion of ["", "malformed"]) {
    assert.equal(evaluateUpdatePolicy("2.0.1", { hardVersion: "2.1.0", softVersion }).status, "hardUpdate");
  }
});

test("exact hard version is permitted and soft recommendations remain available", () => {
  assert.deepEqual(evaluateUpdatePolicy("2.1.0", { hardVersion: "2.1.0", softVersion: "2.2.0" }), {
    status: "softUpdate", currentVersion: "2.1.0", latestVersion: "2.2.0",
  });
  assert.equal(evaluateUpdatePolicy("2.2.0", { hardVersion: "2.1.0", softVersion: "2.2.0" }).status, "latest");
  assert.equal(evaluateUpdatePolicy("3.0.0", { hardVersion: "2.1.0", softVersion: "2.2.0" }).status, "latest");
});

test("missing or malformed policy and invalid current versions fail open", () => {
  assert.equal(evaluateUpdatePolicy("2.0.1", { hardVersion: "", softVersion: "" }).status, "latest");
  assert.equal(evaluateUpdatePolicy("2.0.1", { hardVersion: "9.invalid.9", softVersion: "NaN" }).status, "latest");
  assert.equal(evaluateUpdatePolicy("unknown", { hardVersion: "9.0.0", softVersion: "9.1.0" }).status, "latest");
  assert.equal(evaluateUpdatePolicy("2.0.1", { hardVersion: "invalid", softVersion: "2.1.0" }).status, "softUpdate");
});

test("official HTTPS store listings are accepted for their own platform", () => {
  const android = "https://play.google.com/store/apps/details?id=com.clody.corp&hl=ko";
  const ios = "https://apps.apple.com/kr/app/example/id1234567890";
  assert.equal(validateStoreUrl(android, "android"), android);
  assert.equal(validateStoreUrl(` ${ios} `, "ios"), ios);
  assert.equal(validateStoreUrl(android, "ios"), "");
  assert.equal(validateStoreUrl(ios, "android"), "");
});

test("unconfigured URLs and unsafe or non-listing destinations are rejected", () => {
  for (const url of ["", "https://example.com", "javascript:alert(1)", "market://details?id=com.clody.corp", "http://play.google.com/store/apps/details?id=com.clody.corp", "https://play.google.com.evil.test/store/apps/details?id=com.clody.corp", "https://account@play.google.com/store/apps/details?id=com.clody.corp", "https://play.google.com:8080/store/apps/details?id=com.clody.corp", "https://play.google.com/store/apps/details", "https://play.google.com/store/apps/details?id=not-package", "https://play.google.com/store/apps/collection/topfree"]) {
    assert.equal(validateStoreUrl(url, "android"), "", url);
  }
  assert.equal(validateStoreUrl("https://apps.apple.com/kr/search?term=clody", "ios"), "");
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function remoteEnvironment(options = {}) {
  const calls = [];
  const values = { ...options.cache };
  const config = {};
  let unavailable = false;
  const module = {
    getRemoteConfig() {
      if (unavailable || options.unavailable) throw new Error("SDK unavailable");
      return config;
    },
    async setDefaults(instance, defaults) {
      assert.equal(instance, config);
      calls.push(["defaults", defaults]);
      if (options.initialize) await options.initialize();
      for (const [key, value] of Object.entries(defaults)) {
        if (!(key in values)) values[key] = value;
      }
    },
    async setConfigSettings(instance, settings) {
      assert.equal(instance, config);
      calls.push(["settings", settings]);
    },
    async fetchAndActivate(instance) {
      assert.equal(instance, config);
      calls.push(["fetch"]);
      if (options.fetch) await options.fetch();
      if (options.fetchError) throw options.fetchError;
      Object.assign(values, options.fetched);
      return true;
    },
    getValue(instance, key) {
      assert.equal(instance, config);
      return { asString: () => values[key] ?? "" };
    },
  };
  const client = loadSource("shared/updates/remoteConfigClient.native.ts", {
    "@react-native-firebase/remote-config": module,
    "./versionPolicy": policy,
  }, options.dev, options.clock);
  return { client, calls, setUnavailable: () => { unavailable = true; } };
}

test("native client reads existing legacy version keys and platform store URLs", async () => {
  const env = remoteEnvironment({ fetched: {
    rn_update_version_hard: " 2.1.0 ", rn_update_version_soft: "2.2.0",
    app_update_store_url_android: "https://play.google.com/store/apps/details?id=com.clody.corp",
    app_update_store_url_ios: "https://apps.apple.com/app/id1234567890",
  } });
  assert.deepEqual(await env.client.fetchUpdatePolicy(), {
    hardVersion: "2.1.0", softVersion: "2.2.0",
    androidStoreUrl: "https://play.google.com/store/apps/details?id=com.clody.corp",
    iosStoreUrl: "https://apps.apple.com/app/id1234567890",
  });
  assert.deepEqual(env.calls.find(([name]) => name === "settings")[1], {
    minimumFetchIntervalMillis: 3_600_000, fetchTimeMillis: 5_000,
  });
});

test("offline fetch keeps an activated hard policy effective", async () => {
  const env = remoteEnvironment({
    cache: { rn_update_version_hard: "2.1.0", rn_update_version_soft: "" },
    fetchError: new Error("offline"),
  });
  const cached = await env.client.fetchUpdatePolicy();
  assert.equal(evaluateUpdatePolicy("2.0.1", cached).status, "hardUpdate");
});

test("offline first launch and unavailable Firebase fail open", async () => {
  for (const options of [{ fetchError: new Error("offline") }, { unavailable: true }]) {
    const env = remoteEnvironment(options);
    const result = await env.client.fetchUpdatePolicy();
    assert.equal(evaluateUpdatePolicy("2.0.1", result).status, "latest");
    assert.equal(result.iosStoreUrl, "");
  }
});

test("a later SDK read failure retains the last successfully read policy", async () => {
  const env = remoteEnvironment({ cache: { rn_update_version_hard: "2.1.0" } });
  await env.client.fetchUpdatePolicy();
  env.setUnavailable();
  assert.equal(evaluateUpdatePolicy("2.0.1", await env.client.fetchUpdatePolicy()).status, "hardUpdate");
});

test("concurrent startup and resume checks share one fetch and can later retry", async () => {
  const fetch = deferred();
  const env = remoteEnvironment({ fetch: () => fetch.promise });
  const first = env.client.fetchUpdatePolicy();
  const second = env.client.fetchUpdatePolicy();
  assert.equal(first, second);
  fetch.resolve();
  await Promise.all([first, second]);
  assert.equal(env.calls.filter(([name]) => name === "fetch").length, 1);
  await env.client.fetchUpdatePolicy();
  assert.equal(env.calls.filter(([name]) => name === "fetch").length, 2);
});

test("a manual retry bypasses the production cache interval and then restores it", async () => {
  const env = remoteEnvironment({
    cache: { rn_update_version_hard: "9.0.0" },
    fetched: { rn_update_version_hard: "2.0.1" },
  });
  const result = await env.client.fetchUpdatePolicy({ forceRefresh: true });
  assert.equal(evaluateUpdatePolicy("2.0.1", result).status, "latest");
  assert.deepEqual(env.calls.filter(([name]) => name === "settings").map(([, settings]) => settings.minimumFetchIntervalMillis), [0, 3_600_000]);
  await env.client.fetchUpdatePolicy();
  assert.equal(env.calls.filter(([name]) => name === "settings").at(-1)[1].minimumFetchIntervalMillis, 3_600_000);
});

test("a failed manual refresh keeps the cached hard policy and restores the normal interval", async () => {
  const env = remoteEnvironment({ cache: { rn_update_version_hard: "9.0.0" }, fetchError: new Error("offline") });
  const result = await env.client.fetchUpdatePolicy({ forceRefresh: true });
  assert.equal(evaluateUpdatePolicy("2.0.1", result).status, "hardUpdate");
  assert.deepEqual(env.calls.filter(([name]) => name === "settings").map(([, settings]) => settings.minimumFetchIntervalMillis), [0, 3_600_000]);
});

test("a manual check shares an already pending check instead of starting a second native fetch", async () => {
  const fetch = deferred();
  const env = remoteEnvironment({ fetch: () => fetch.promise });
  const first = env.client.fetchUpdatePolicy();
  const manual = env.client.fetchUpdatePolicy({ forceRefresh: true });
  assert.equal(first, manual);
  fetch.resolve();
  await Promise.all([first, manual]);
  assert.equal(env.calls.filter(([name]) => name === "fetch").length, 1);
});

test("development can refresh immediately and invalid remote URLs remain empty", async () => {
  const env = remoteEnvironment({ dev: true, fetched: {
    app_update_store_url_android: "https://example.com/install",
    app_update_store_url_ios: "javascript:alert(1)",
  } });
  const result = await env.client.fetchUpdatePolicy();
  assert.equal(result.androidStoreUrl, "");
  assert.equal(result.iosStoreUrl, "");
  assert.equal(env.calls.find(([name]) => name === "settings")[1].minimumFetchIntervalMillis, 0);
});

test("web fallback does not import the native Firebase client", async () => {
  const client = loadSource("shared/updates/remoteConfigClient.ts");
  assert.equal(evaluateUpdatePolicy("2.0.1", await client.fetchUpdatePolicy()).status, "latest");
});

async function settle() {
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
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
    this.now += milliseconds;
    for (const [id, timer] of [...this.timers]) {
      if (timer.at <= this.now) {
        this.timers.delete(id);
        timer.callback();
      }
    }
    await settle();
  }
}

test("a stalled native fetch returns the activated hard policy at the five-second deadline", async () => {
  const clock = new Clock();
  const fetch = deferred();
  const env = remoteEnvironment({ clock, fetch: () => fetch.promise, cache: { rn_update_version_hard: "2.1.0" } });
  let result;
  const pending = env.client.fetchUpdatePolicy().then((value) => { result = value; });
  await settle();
  await clock.advance(4_999);
  assert.equal(result, undefined);
  await clock.advance(1);
  await pending;
  assert.equal(evaluateUpdatePolicy("2.0.1", result).status, "hardUpdate");
  assert.equal(clock.timers.size, 0);
  fetch.reject(new Error("late native timeout"));
  await settle();
});

test("the deadline also bounds SDK initialization and a later check can read a completed fetch", async () => {
  const clock = new Clock();
  const initialize = deferred();
  const env = remoteEnvironment({
    clock, initialize: () => initialize.promise,
    fetched: { rn_update_version_hard: "2.2.0" },
  });
  const first = env.client.fetchUpdatePolicy();
  await settle();
  await clock.advance(5_000);
  assert.equal(evaluateUpdatePolicy("2.0.1", await first).status, "latest");
  initialize.resolve();
  await settle();
  assert.equal((await env.client.fetchUpdatePolicy()).hardVersion, "2.2.0");
  assert.equal(clock.timers.size, 0);
});
