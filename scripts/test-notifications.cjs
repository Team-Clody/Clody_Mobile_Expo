// Offline notification regressions. Run: node scripts/test-notifications.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.dirname(require.resolve("../package.json"));
function loadSource(relativeFilename) {
  const filename = path.join(root, relativeFilename);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const loadedModule = { exports: {} };
  new Function("exports", compiled.outputText)(loadedModule.exports);
  return loadedModule.exports;
}

const { getNotificationRoute } = loadSource("shared/notifications/notificationRoute.ts");
const { createTokenSync } = loadSource("shared/notifications/tokenSync.ts");
const mainRoute = "/(home)/(tabs)/main";

test("reply notifications open their validated diary date", () => {
  for (const date of ["2026-11-12", "2024-02-29", "2000-02-29", "0001-01-01"]) {
    assert.deepEqual(getNotificationRoute({ type: "reply", date }), {
      pathname: "/(home)/reply/[date]",
      params: { date, status: "READY_NOT_READ" },
    });
  }
});

test("impossible or malformed reply dates fall back to the calendar", () => {
  for (const date of [
    undefined, null, 20261112, ["2026-11-12"], "", "0000-01-01",
    "2026-02-29", "1900-02-29", "2026-04-31", "2026-13-01", "2026-00-01",
    "2026-11-00", "2026-11-32", "2026-1-12", "2026-11-12T00:00:00Z",
    "2026-11-12/../../profile",
  ]) {
    assert.equal(getNotificationRoute({ type: "reply", date }), mainRoute, String(date));
  }
});

test("diary reminders open the diary editor", () => {
  for (const type of ["diary", "diary_reminder"]) {
    assert.equal(getNotificationRoute({ type }), "/(home)/diaryWrite");
  }
});

test("missing or unknown payloads fall back to the calendar", () => {
  for (const data of [undefined, null, {}, { type: "broadcast" }, { type: ["reply"] }, { type: "REPLY", date: "2026-11-12" }]) {
    assert.equal(getNotificationRoute(data), mainRoute);
  }
});

test("untrusted URLs and route parameters cannot choose arbitrary destinations", () => {
  assert.equal(getNotificationRoute({ url: "https://example.com", route: "/profile" }), mainRoute);
  assert.equal(getNotificationRoute({ type: "https://example.com", date: "2026-11-12" }), mainRoute);
  assert.deepEqual(getNotificationRoute({
    type: "reply", date: "2026-11-12", url: "clodymobileexpo://profile",
    pathname: "/introduce", status: "READY_READ",
  }), {
    pathname: "/(home)/reply/[date]",
    params: { date: "2026-11-12", status: "READY_NOT_READ" },
  });
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test("successful token synchronization deduplicates and ignores empty tokens", async () => {
  const sent = [];
  const queue = createTokenSync(async (token) => { sent.push(token); });
  await queue.sync("");
  await queue.sync("   ");
  await queue.sync("first");
  await queue.sync("first");
  assert.deepEqual(sent, ["first"]);
});

test("refreshes serialize so an older request cannot overwrite the latest token", async () => {
  const first = deferred();
  const sent = [];
  let serverToken;
  const queue = createTokenSync(async (token) => {
    sent.push(token);
    if (token === "first") await first.promise;
    serverToken = token;
  });
  const initial = queue.sync("first");
  await Promise.resolve();
  const middle = queue.sync("middle");
  const latest = queue.sync("latest");
  assert.deepEqual(sent, ["first"]);
  first.resolve();
  await Promise.all([initial, middle, latest]);
  assert.deepEqual(sent, ["first", "latest"]);
  assert.equal(serverToken, "latest");
});

test("failed tokens can be retried without caching the failed result", async () => {
  const errors = [];
  let attempts = 0;
  const queue = createTokenSync(async () => {
    attempts += 1;
    if (attempts === 1) throw new Error("network failure");
  }, (error) => { errors.push(error.message); });
  await queue.sync("retry");
  await queue.sync("retry");
  await queue.sync("retry");
  assert.equal(attempts, 2);
  assert.deepEqual(errors, ["network failure"]);
});

test("a failed older request still allows the queued newest token to sync", async () => {
  const first = deferred();
  const sent = [];
  const errors = [];
  const queue = createTokenSync(async (token) => {
    sent.push(token);
    if (token === "old") await first.promise;
  }, (error) => { errors.push(error.message); });
  const initial = queue.sync("old");
  await Promise.resolve();
  const latest = queue.sync("new");
  first.reject(new Error("offline"));
  await Promise.all([initial, latest]);
  assert.deepEqual(sent, ["old", "new"]);
  assert.deepEqual(errors, ["offline"]);
});

test("stopping aborts the active request, drops queued work, and ignores later syncs", async () => {
  const first = deferred();
  const sent = [];
  const errors = [];
  let signal;
  const queue = createTokenSync(async (token, currentSignal) => {
    sent.push(token);
    signal = currentSignal;
    await first.promise;
  }, (error) => { errors.push(error); });
  const active = queue.sync("active");
  await Promise.resolve();
  const queued = queue.sync("queued");
  queue.stop();
  assert.equal(signal.aborted, true);
  await queue.sync("after-logout");
  first.reject(new Error("request aborted"));
  await Promise.all([active, queued]);
  assert.deepEqual(sent, ["active"]);
  assert.deepEqual(errors, []);
});

test("an unsent session can be stopped before its first request starts", async () => {
  let sent = false;
  const queue = createTokenSync(async () => { sent = true; });
  const pending = queue.sync("first");
  queue.stop();
  await pending;
  assert.equal(sent, false);
});
