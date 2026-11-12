// Exercise onboarding reminder saves through the real API adapter.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.dirname(require.resolve("../package.json"));

function load(relativePath, modules) {
  const filename = path.join(root, relativePath);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "exports", compiled)((name) => {
    assert.ok(name in modules, `Unexpected module: ${name}`);
    return modules[name];
  }, loaded.exports);
  return loaded.exports;
}

function environment(failure) {
  const calls = [];
  const http = {
    HeaderType: { ACCESS_TOKEN: "ACCESS_TOKEN", TIME_ZONE: "TIME_ZONE" },
    async createAPIRequest(...args) {
      calls.push(args);
      if (failure) throw failure;
      return { data: { data: { isDiaryAlarm: true, time: "23:47" } } };
    },
  };
  const api = load("api/myPageAPI.ts", { "@/shared/http": http });
  const service = load("services/onboardingReminderService.ts", {
    "@/api/myPageAPI": api,
    "@/shared/http": http,
  });
  return { calls, save: service.saveOnboardingReminder };
}

test("onboarding saves the selected local time and enables the diary reminder", async () => {
  const env = environment();
  await env.save({ enabled: true, time: "23:47" });
  assert.deepEqual(env.calls, [[
    "post", "/api/v1/alarm", "TIME_ZONE",
    { isDiaryAlarm: true, time: "23:47" },
  ]]);
});

test("skipping disables only the diary reminder and preserves other settings", async () => {
  const env = environment();
  await env.save({ enabled: false });
  assert.deepEqual(env.calls, [[
    "post", "/api/v1/alarm", "TIME_ZONE", { isDiaryAlarm: false },
  ]]);
});

test("midnight and noon remain unambiguous 24-hour local times", async () => {
  const env = environment();
  await env.save({ enabled: true, time: "00:00" });
  await env.save({ enabled: true, time: "12:00" });
  assert.deepEqual(env.calls.map((call) => call[3].time), ["00:00", "12:00"]);
});

test("invalid reminder times never reach the server", async () => {
  const env = environment();
  for (const time of ["24:00", "12:60", "9:30", "", "09:30:00", "-1:00"]) {
    await assert.rejects(env.save({ enabled: true, time }), /INVALID_REMINDER_TIME/);
  }
  assert.equal(env.calls.length, 0);
});

test("save failures reach the caller so it can retry settings without signing up again", async () => {
  const failure = new Error("network unavailable");
  const env = environment(failure);
  await assert.rejects(env.save({ enabled: true, time: "09:30" }), (error) => error === failure);
  assert.equal(env.calls.length, 1);
});
