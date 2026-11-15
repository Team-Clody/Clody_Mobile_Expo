const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const Renderer = require("react-test-renderer");
const load = require("./helpers/load-typescript.cjs");
const { act } = React;
global.IS_REACT_ACT_ENVIRONMENT = true;

function deferred() {
  let resolve;
  const promise = new Promise((yes) => { resolve = yes; });
  return { promise, resolve };
}

function nativeMocks() {
  return {
    View: "View", Text: "Text", StyleSheet: { create: (value) => value },
    Animated: {
      View: "AnimatedView",
      Value: class { constructor(value) { this.value = value; } setValue(value) { this.value = value; } },
      timing: (_value, options) => {
        let timer;
        return {
          start: (callback) => { if (callback) timer = setTimeout(() => callback({ finished: true }), options.duration); },
          stop: () => clearTimeout(timer),
        };
      },
    },
  };
}

function toastEnvironment(t) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { Toast } = load("shared/components/Toast.tsx", {
    "react-native": nativeMocks(),
    "./typo/Typo": { Typo: { Body: "Text" } },
    "./Icon": { Icon: { IcWarning: "Warning", IcSuccess: "Success" } },
  });
  let root;
  const calls = [];
  const render = (overrides = {}) => act(() => {
    const props = { visible: true, message: "Draft saved", onHide: () => calls.push("hidden"), ...overrides };
    const element = React.createElement(Toast, props);
    if (root) root.update(element); else root = Renderer.create(element);
  });
  const tick = (ms) => act(() => t.mock.timers.tick(ms));
  t.after(() => act(() => root?.unmount()));
  return { calls, render, tick, unmount: () => act(() => root.unmount()) };
}

test("a toast expires despite the home's one-second parent renders and fresh callbacks", (t) => {
  const env = toastEnvironment(t);
  env.render();
  env.tick(1000);
  env.render({ onHide: () => env.calls.push("second-render") });
  env.tick(1000);
  env.render({ onHide: () => env.calls.push("latest-render") });
  env.tick(300);
  assert.deepEqual(env.calls, ["latest-render"]);
  env.tick(5000);
  assert.equal(env.calls.length, 1);
});

test("replacing a toast cancels its old dismissal and gives the new message its full duration", (t) => {
  const env = toastEnvironment(t);
  env.render();
  env.tick(2100); // Old exit animation has started.
  env.render({ message: "Skin saved" });
  env.tick(2000);
  assert.deepEqual(env.calls, []);
  env.tick(300);
  assert.deepEqual(env.calls, ["hidden"]);
});

test("unmounting a toast cancels its pending callback", (t) => {
  const env = toastEnvironment(t);
  env.render();
  env.tick(2000);
  env.unmount();
  env.tick(1000);
  assert.deepEqual(env.calls, []);
});

function focusEnvironment(t, filename, exportName, mocks, selectArguments) {
  const Focus = React.createContext(true);
  const useFocusEffect = (callback) => {
    const focused = React.useContext(Focus);
    React.useEffect(() => focused ? callback() : undefined, [focused, callback]);
  };
  const hook = load(filename, { ...mocks, "expo-router": { useFocusEffect } })[exportName];
  let current;
  let root;
  let props = { focused: true, enabled: true };
  function Probe(p) { current = hook(...selectArguments(p)); return null; }
  const render = async (changes = {}) => {
    props = { ...props, ...changes };
    await act(async () => {
      const element = React.createElement(Focus.Provider, { value: props.focused }, React.createElement(Probe, props));
      if (root) root.update(element); else root = Renderer.create(element);
    });
  };
  t.after(() => act(() => root?.unmount()));
  return { render, value: () => current };
}

function draftEnvironment(t, fetch) {
  return focusEnvironment(t, "shared/diary/useSelectedDraft.ts", "useSelectedDraft", {
    "@/api/diaryAPI": { DiaryAPI: { getDraft: fetch } },
  }, (p) => [p.date ?? new Date(2026, 10, 14), p.hasDiary ?? false, p.enabled]);
}

test("returning after a successful save reloads the draft for the continue-writing action", async (t) => {
  let contents = [];
  const env = draftEnvironment(t, async () => ({ draftDiaries: contents }));
  await env.render();
  assert.equal(env.value(), false);
  await env.render({ focused: false });
  contents = ["Thank you", "", ""];
  await env.render({ focused: true });
  assert.equal(env.value(), true);
});

test("draft lookup treats blank entries as empty", async (t) => {
  const env = draftEnvironment(t, async () => ({ draftDiaries: ["", "  ", "\n"] }));
  await env.render();
  assert.equal(env.value(), false);
});

test("a late draft result for the previous selected date cannot change the current action", async (t) => {
  const old = deferred();
  const env = draftEnvironment(t, async (_year, _month, day) => day === 14 ? old.promise : { draftDiaries: [] });
  await env.render({ date: new Date(2026, 10, 14) });
  await env.render({ date: new Date(2026, 10, 13) });
  await act(async () => old.resolve({ draftDiaries: ["old date draft"] }));
  assert.equal(env.value(), false);
});

test("a failed draft refresh preserves the saved state rather than reverting to write-entry", async (t) => {
  let fail = false;
  const env = draftEnvironment(t, async () => {
    if (fail) throw Error("offline");
    return { draftDiaries: ["draft"] };
  });
  await env.render();
  await env.render({ focused: false });
  fail = true;
  await env.render({ focused: true });
  assert.equal(env.value(), true);
});

test("submitted diaries and unauthenticated screens do not request a draft", async (t) => {
  let requests = 0;
  const env = draftEnvironment(t, async () => { requests++; return { draftDiaries: [] }; });
  await env.render({ hasDiary: true });
  await env.render({ hasDiary: false, enabled: false });
  assert.equal(requests, 0);
});

test("home refreshes the equipped appearance after returning from the wardrobe", async (t) => {
  let equipped = { inventoryId: null, skinUrl: null, skinCloverStage: null };
  const env = focusEnvironment(t, "shared/skins/useEquippedSkin.ts", "useEquippedSkin", {
    "@/api/skinAPI": { SkinAPI: { getEquippedSkin: async () => equipped } },
  }, (p) => [p.enabled]);
  await env.render();
  assert.equal(env.value().inventoryId, null);
  await env.render({ focused: false });
  equipped = { inventoryId: 101, skinUrl: "skin.png", skinCloverStage: "STAGE_1" };
  await env.render({ focused: true });
  assert.equal(env.value().inventoryId, 101);
});

test("a response from an earlier visit cannot overwrite the newly equipped skin", async (t) => {
  const old = deferred();
  let requests = 0;
  const env = focusEnvironment(t, "shared/skins/useEquippedSkin.ts", "useEquippedSkin", {
    "@/api/skinAPI": { SkinAPI: { getEquippedSkin: () => ++requests === 1 ? old.promise : Promise.resolve({ inventoryId: 102, skinCloverStage: "STAGE_2" }) } },
  }, (p) => [p.enabled]);
  await env.render();
  await env.render({ focused: false });
  await env.render({ focused: true });
  await act(async () => old.resolve({ inventoryId: null }));
  assert.equal(env.value().inventoryId, 102);
});

test("skin rendering maps the wardrobe and home to the same costume artwork", () => {
  const { getSkinCharacterSource: source } = load("shared/skins/skinAppearance.ts", {
    "@/assets/images/farmer.png": 101, "@/assets/images/princess.png": 102, "@/assets/images/devil.png": 103,
  });
  assert.equal(source("STAGE_1", "icon.png"), 101);
  assert.equal(source("STAGE_2", "icon.png"), 102);
  assert.equal(source("STAGE_3", "icon.png"), 103);
  assert.deepEqual(source("STAGE_4", "future-skin.png"), { uri: "future-skin.png" });
  assert.equal(source(null, null), null);
});
