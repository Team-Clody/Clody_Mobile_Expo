// Native alert boundary regressions. The OS itself is verified on the device.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const source = path.join(__dirname, "../shared/updates/nativeUpdatePrompt.ts");
const compiled = ts.transpileModule(fs.readFileSync(source, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const moduleExports = {};
new Function("exports", compiled.outputText)(moduleExports);
const { createNativeUpdatePrompt } = moduleExports;

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function settle() {
  for (let count = 0; count < 12; count += 1) await Promise.resolve();
}

function environment(options = {}) {
  const alerts = [];
  let active = options.active !== false;
  const content = {
    title: "Update required", message: "2.0.1 -> 2.1.0", confirm: "Store",
    recheck: "Check again", errorTitle: "Store unavailable",
    errorMessage: "Please try again", errorConfirm: "OK",
  };
  let storeCalls = 0;
  let checkCalls = 0;
  const actions = {
    onConfirm: async () => {
      storeCalls += 1;
      return options.openStore?.();
    },
    ...(options.noRecheck ? {} : {
      onRecheck: async () => {
        checkCalls += 1;
        return options.recheck ? options.recheck() : true;
      },
    }),
  };
  const prompt = createNativeUpdatePrompt({
    showAlert: (title, message, buttons, config) => alerts.push({ title, message, buttons, config }),
    isActive: () => active,
    getContent: () => content,
    getActions: () => actions,
  });
  return {
    prompt, alerts, content,
    setActive: (value) => { active = value; },
    count: () => ({ storeCalls, checkCalls }),
    press: (label, alert = alerts.at(-1)) => {
      const button = alert.buttons.find((item) => item.text === label);
      assert.ok(button, `Missing button ${label}`);
      button.onPress();
    },
  };
}

test("a required update uses one noncancelable system popup with update and recheck actions", () => {
  const env = environment();
  env.prompt.show();
  env.prompt.show();
  env.prompt.onActive();
  assert.equal(env.alerts.length, 1);
  assert.equal(env.alerts[0].config.cancelable, false);
  assert.deepEqual(env.alerts[0].buttons.map((button) => button.text), ["Check again", "Store"]);
});

test("a background launch waits for activation before presenting the system popup", () => {
  const env = environment({ active: false });
  env.prompt.show();
  assert.equal(env.alerts.length, 0);
  env.setActive(true);
  env.prompt.onActive();
  assert.equal(env.alerts.length, 1);
});

test("store actions run once and the required popup returns after the external store closes", async () => {
  const opening = deferred();
  const env = environment({ openStore: () => opening.promise });
  env.prompt.show();
  const original = env.alerts[0];
  env.press("Store", original);
  env.press("Store", original);
  env.prompt.onActive();
  await settle();
  assert.deepEqual(env.count(), { storeCalls: 1, checkCalls: 0 });
  assert.equal(env.alerts.length, 1);
  env.setActive(false);
  opening.resolve();
  await settle();
  assert.equal(env.alerts.length, 1);
  env.setActive(true);
  env.prompt.onActive();
  env.prompt.onActive();
  assert.equal(env.alerts.length, 2);
  assert.equal(env.alerts[1].title, "Update required");
});

test("a store action that keeps the app active cannot leave the gate without a popup", async () => {
  const env = environment();
  env.prompt.show();
  env.press("Store");
  await settle();
  assert.equal(env.alerts.length, 2);
  assert.equal(env.alerts[1].title, "Update required");
});

test("a store error is shown once and acknowledgment restores the required update popup", async () => {
  const env = environment({ openStore: () => { throw new Error("URL cannot open"); } });
  env.prompt.show();
  const initial = env.alerts[0];
  env.press("Store");
  await settle();
  assert.equal(env.alerts.length, 2);
  assert.equal(env.alerts[1].title, "Store unavailable");
  env.prompt.onActive();
  assert.equal(env.alerts.length, 2);
  env.press("Store", initial);
  assert.equal(env.count().storeCalls, 1);
  const error = env.alerts[1];
  env.press("OK");
  env.press("OK", error);
  assert.equal(env.alerts.length, 3);
  assert.equal(env.alerts[2].title, "Update required");
});

test("a store error while backgrounded waits until the app becomes active", async () => {
  const opening = deferred();
  const env = environment({ openStore: () => opening.promise });
  env.prompt.show();
  env.press("Store");
  await settle();
  env.setActive(false);
  opening.reject(new Error("native failure"));
  await settle();
  assert.equal(env.alerts.length, 1);
  env.setActive(true);
  env.prompt.onActive();
  assert.equal(env.alerts[1].title, "Store unavailable");
});

test("a manual check that still requires an update reopens with the latest version text", async () => {
  const checking = deferred();
  const env = environment({ recheck: () => checking.promise });
  env.prompt.show();
  env.press("Check again");
  env.prompt.onActive();
  await settle();
  assert.equal(env.alerts.length, 1);
  assert.equal(env.count().checkCalls, 1);
  env.content.message = "2.0.1 -> 2.2.0";
  checking.resolve(true);
  await settle();
  assert.equal(env.alerts.length, 2);
  assert.equal(env.alerts[1].message, "2.0.1 -> 2.2.0");
});

test("a cleared policy does not reopen during the gap before React unmounts the gate", async () => {
  const env = environment({ recheck: () => false });
  env.prompt.show();
  env.press("Check again");
  await settle();
  env.prompt.onActive();
  env.prompt.show();
  assert.equal(env.alerts.length, 1);
});

test("a failed recheck preserves the required update without showing an unrelated store error", async () => {
  const env = environment({ recheck: () => { throw new Error("offline"); } });
  env.prompt.show();
  env.press("Check again");
  await settle();
  assert.equal(env.alerts.length, 2);
  assert.equal(env.alerts[1].title, "Update required");
});

test("stopping before a queued button action runs ignores stale native callbacks", async () => {
  const env = environment();
  env.prompt.show();
  const alert = env.alerts[0];
  env.press("Store");
  env.prompt.stop();
  env.press("Check again", alert);
  env.prompt.onActive();
  await settle();
  assert.deepEqual(env.count(), { storeCalls: 0, checkCalls: 0 });
  assert.equal(env.alerts.length, 1);
});

test("a late store completion after policy removal never presents another popup", async () => {
  for (const failure of [false, true]) {
    const opening = deferred();
    const env = environment({ openStore: () => opening.promise });
    env.prompt.show();
    env.press("Store");
    await settle();
    env.prompt.stop();
    if (failure) opening.reject(new Error("late failure"));
    else opening.resolve();
    await settle();
    env.prompt.onActive();
    assert.equal(env.alerts.length, 1);
  }
});

test("the legacy adapter can show a single update action without a manual recheck", () => {
  const env = environment({ noRecheck: true });
  env.prompt.show();
  assert.deepEqual(env.alerts[0].buttons.map((button) => button.text), ["Store"]);
});
