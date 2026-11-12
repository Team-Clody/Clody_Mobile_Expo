// Exercise the real HTTP interceptor with mocked storage and transport boundaries.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const filename = path.join(path.dirname(require.resolve("../package.json")), "shared/http.ts");
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
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
}

function httpError(status, url = "/api/v1/auth/reissue") {
  return Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status },
    config: { url, headers: { Authorization: "Bearer old-access" } },
  });
}

function environment(refresh) {
  const state = { access: "old-access", refresh: "old-refresh", isLoggedIn: true };
  const calls = { refresh: 0, saved: 0, cleared: 0, retried: [] };
  let rejected;
  let refreshRequest = refresh;
  const storage = {
    async getAccessToken() { return state.access; },
    async getRefreshToken() { return state.refresh; },
    async saveTokens(access, refreshToken) {
      calls.saved += 1;
      state.access = access;
      state.refresh = refreshToken;
    },
    async clearTokens() {
      calls.cleared += 1; // This boundary also invalidates the FCM token.
      state.access = null;
      state.refresh = null;
    },
  };
  const transport = {
    interceptors: {
      request: { use() {} },
      response: { use(_fulfilled, onRejected) { rejected = onRejected; } },
    },
    async get(url, config) {
      calls.refresh += 1;
      assert.equal(url, "/api/v1/auth/reissue");
      assert.equal(config.headers.Authorization, "Bearer old-refresh");
      return refreshRequest();
    },
    async request(config) { calls.retried.push(config); return { status: 200 }; },
  };
  const modules = {
    axios: {
      __esModule: true,
      default: { create: () => transport },
      isAxiosError: (error) => error?.isAxiosError === true,
    },
    "@/shared/storage/tokenStorage": { tokenStorage: storage },
    "@/shared/utils/timezone": { getDeviceTimeZone: () => "Asia/Seoul" },
    "@/shared/utils/locale": { getDeviceLocale: () => "ko" },
    "@/store/useAppStore": {
      useAppStore: { getState: () => ({ setIsLoggedIn: (value) => { state.isLoggedIn = value; } }) },
    },
  };
  const loaded = { exports: {} };
  new Function("require", "exports", compiled)((name) => {
    assert.ok(name in modules, `Unexpected module: ${name}`);
    return modules[name];
  }, loaded.exports);
  return {
    state, calls,
    failAccess: () => rejected(httpError(401, "/api/v1/alarm")),
    setRefreshRequest: (next) => { refreshRequest = next; },
  };
}

const renewed = () => Promise.resolve({ data: { data: { accessToken: "renewed-access", refreshToken: "renewed-refresh" } } });

test("confirmed refresh expiry clears auth and FCM state and signs the UI out", async () => {
  const env = environment(() => Promise.reject(httpError(401)));
  await assert.rejects(env.failAccess(), (error) => error.status === 401);
  assert.deepEqual(env.state, { access: null, refresh: null, isLoggedIn: false });
  assert.equal(env.calls.cleared, 1);
  assert.equal(env.calls.retried.length, 0);
});

test("missing refresh credentials also invalidates the visible session", async () => {
  const env = environment(renewed);
  env.state.refresh = null;
  await assert.rejects(env.failAccess(), (error) => error.status === 401);
  assert.equal(env.state.isLoggedIn, false);
  assert.equal(env.calls.cleared, 1);
  assert.equal(env.calls.refresh, 0);
});

test("network, timeout and server failures preserve auth and FCM state and the original error", async () => {
  const failures = [new Error("offline"), Object.assign(new Error("timeout"), { code: "ECONNABORTED", isAxiosError: true }), httpError(500), httpError(503)];
  for (const failure of failures) {
    const env = environment(() => Promise.reject(failure));
    await assert.rejects(env.failAccess(), (error) => error === failure);
    assert.deepEqual(env.state, { access: "old-access", refresh: "old-refresh", isLoggedIn: true });
    assert.equal(env.calls.cleared, 0);
    assert.equal(env.calls.saved, 0);
    // Failure releases the shared promise so a later request can recover.
    env.setRefreshRequest(renewed);
    await env.failAccess();
    assert.equal(env.calls.refresh, 2);
    assert.equal(env.state.access, "renewed-access");
  }
});

test("concurrent access failures share one refresh and retry with the renewed token", async () => {
  const pending = deferred();
  const env = environment(() => pending.promise);
  const requests = [env.failAccess(), env.failAccess()];
  await settle();
  assert.equal(env.calls.refresh, 1);
  pending.resolve(await renewed());
  await Promise.all(requests);
  assert.equal(env.calls.saved, 1);
  assert.equal(env.calls.cleared, 0);
  assert.equal(env.calls.retried.length, 2);
  assert.ok(env.calls.retried.every((config) => config.headers.Authorization === "Bearer renewed-access"));
});

test("an old successful refresh cannot overwrite a newer login", async () => {
  const pending = deferred();
  const env = environment(() => pending.promise);
  const request = env.failAccess();
  await settle();
  Object.assign(env.state, { access: "new-session-access", refresh: "new-session-refresh" });
  pending.resolve(await renewed());
  await assert.rejects(request, (error) => error.status === 409);
  assert.deepEqual(env.state, { access: "new-session-access", refresh: "new-session-refresh", isLoggedIn: true });
  assert.equal(env.calls.saved, 0);
  assert.equal(env.calls.cleared, 0);
  assert.equal(env.calls.retried.length, 0);
});

test("an old expired refresh cannot clear a newer login or its FCM token", async () => {
  const pending = deferred();
  const env = environment(() => pending.promise);
  const request = env.failAccess();
  await settle();
  Object.assign(env.state, { access: "new-session-access", refresh: "new-session-refresh" });
  const oldFailure = httpError(401);
  pending.reject(oldFailure);
  await assert.rejects(request, (error) => error === oldFailure);
  assert.deepEqual(env.state, { access: "new-session-access", refresh: "new-session-refresh", isLoggedIn: true });
  assert.equal(env.calls.cleared, 0);
  assert.equal(env.calls.saved, 0);
});

test("a refresh that completes after logout does not restore the old session", async () => {
  const pending = deferred();
  const env = environment(() => pending.promise);
  const request = env.failAccess();
  await settle();
  Object.assign(env.state, { access: null, refresh: null, isLoggedIn: false });
  pending.resolve(await renewed());
  await assert.rejects(request, (error) => error.status === 409);
  assert.deepEqual(env.state, { access: null, refresh: null, isLoggedIn: false });
  assert.equal(env.calls.saved, 0);
  assert.equal(env.calls.cleared, 0);
});
