const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const Renderer = require("react-test-renderer");
const load = require("./helpers/load-typescript.cjs");
const { act } = React;
global.IS_REACT_ACT_ENVIRONMENT = true;
const flatten = (styles) => Object.assign({}, ...[styles].flat(Infinity).filter(Boolean));

function dockEnvironment(t, platform, initiallyVisible = false) {
  const listeners = new Map();
  const native = {
    View: "View", Text: "Text", Pressable: "Button", Platform: { OS: platform },
    StyleSheet: { create: (v) => v },
    Keyboard: { isVisible: () => initiallyVisible, addListener: (name, fn) => {
      listeners.set(name, fn); return { remove: () => listeners.delete(name) };
    } },
  };
  const Button = load("shared/components/Button.tsx", { "react-native": native, "./typo/Typo": { Typo: { Body: "Text" } } });
  const { BottomActionButton } = load("shared/components/BottomActionButton.tsx", { "react-native": native, "./Button": Button });
  let root;
  t.after(() => act(() => root?.unmount()));
  return {
    mount: (disabled = false) => act(() => { root = Renderer.create(React.createElement(BottomActionButton, { title: "Next", isDisabled: disabled, onPress() {} })); }),
    emit: (name) => act(() => listeners.get(name)?.()),
    container: () => flatten(root.root.findByType("View").props.style),
    button: () => flatten(root.root.findAllByType("View").at(-1).props.style),
    listeners, root: () => root,
  };
}
for (const platform of ["ios", "android"]) {
  test(`${platform}: the CTA spans the keyboard width with square corners and returns to its inset rounded state`, (t) => {
    const env = dockEnvironment(t, platform);
    env.mount();
    assert.equal(env.container().paddingHorizontal, 14);
    assert.equal(env.button().borderRadius, 6);
    env.emit(platform === "ios" ? "keyboardWillShow" : "keyboardDidShow");
    assert.equal(env.container().paddingHorizontal, 0);
    assert.equal(env.container().paddingBottom, 0);
    assert.equal(env.button().borderRadius, 0);
    env.emit(platform === "ios" ? "keyboardWillHide" : "keyboardDidHide");
    assert.equal(env.container().paddingHorizontal, 14);
    assert.equal(env.button().borderRadius, 6);
  });
}
test("an already open keyboard starts with the docked CTA and subscriptions are removed", (t) => {
  const env = dockEnvironment(t, "android", true);
  env.mount(true);
  assert.equal(env.button().borderRadius, 0);
  assert.equal(env.root().root.findByType("Button").props.disabled, true);
  act(() => env.root().unmount());
  assert.equal(env.listeners.size, 0);
});

test("the monthly calendar weekly-view control closes the sheet", async (t) => {
  let closed = 0;
  const { MonthlyCalendarSheet } = load("app/(home)/(tabs)/main/_components/MonthlyCalendarSheet.tsx", {
    "react-native": { Animated: { View: "AnimatedView" }, Platform: { OS: "android" }, Pressable: "Button", StyleSheet: { absoluteFillObject: {} }, Text: "Text", View: "View" },
    "expo-blur": { BlurView: "BlurView" },
    "@/assets/icons/ic_clover.svg": "Clover", "@/assets/icons/ic_down.svg": "Down", "@/assets/Ellipse2636.svg": "Unread",
    "@/app/i18n/i18n": { t: (key) => key }, "./CloverDayOverlay": { CloverDayOverlay: "Day" },
    "../_constants": { MONTHLY_SHEET_CLOVER_ROW_GAP: 10, MONTHLY_TODAY_BADGE_SIZE: { ko: {}, en: {} } },
    "@/shared/theme/localeTypography": { fontPreset: {} },
    "../_utils/calendarDataUtils": { getMonthMatrix: () => [] },
    "../_utils/dateUtils": { formatMonth: () => "November 2026" },
    "../_utils/cloverUtils": {},
  });
  let root;
  t.after(() => act(() => root?.unmount()));
  await act(async () => { root = Renderer.create(React.createElement(MonthlyCalendarSheet, {
    calendarDate: new Date(2026, 10, 14), today: new Date(2026, 10, 14), gratitudeDate: new Date(2026, 10, 14),
    weekDays: [], panHandlers: {}, onClose: () => closed++,
  })); });
  const weekly = root.root.findAllByType("Button").find((n) => n.props.accessibilityLabel === "main.header.weekly");
  assert.ok(weekly);
  act(() => weekly.props.onPress());
  assert.equal(closed, 1);
});

const progress = load("shared/clover/cloverProgress.ts").getCloverProgress;
test("all 21 stage boundaries advance with the cumulative target and completed mission clamped", () => {
  for (let level = 1; level <= 21; level++) {
    const minimum = level <= 5 ? (level - 1) * 2 : 10 + (level - 6) * 14;
    const required = level <= 5 ? 2 : 14;
    assert.deepEqual(progress(minimum), { level, total: minimum, target: minimum + required, required, completed: 0 });
    assert.equal(progress(minimum + required - 1).level, level);
    assert.equal(progress(minimum + required - 1).completed, required - 1);
  }
  assert.equal(progress(1000).level, 21);
  assert.equal(progress(1000).completed, 14);
});
test("server stage and target take precedence, including later stages and changed thresholds", () => {
  assert.equal(progress(40, { stage: 10, target: 60 }).level, 10);
  assert.equal(progress(40, { stage: 10, target: 60 }).target, 60);
  assert.equal(progress(40, { stage: 10, target: 60 }).completed, 0);
  assert.equal(progress(234, { stage: 21, target: 234 }).completed, 14);
  assert.deepEqual(progress(2, { stage: 99, target: 100 }), progress(2));
});

test("home stage summary refreshes on focus and does not accept stale results after blur", async (t) => {
  const Focus = React.createContext(true);
  let resolve;
  let calls = 0;
  const hook = load("shared/skins/useCloverSummary.ts", {
    "expo-router": { useFocusEffect: (cb) => { const focused = React.useContext(Focus); React.useEffect(() => focused ? cb() : undefined, [focused, cb]); } },
    "@/api/skinAPI": { SkinAPI: { getSkinStatusList: () => ++calls === 1 ? new Promise((r) => { resolve = r; }) : Promise.resolve({ currentStage: 21, currentStageMaxClover: 234, totalCloverCount: 230 }) } },
  }).useCloverSummary;
  let current, root;
  function Probe({ enabled }) { current = hook(enabled); return null; }
  const render = async (focused, enabled = true) => act(async () => {
    const el = React.createElement(Focus.Provider, { value: focused }, React.createElement(Probe, { enabled }));
    if (root) root.update(el); else root = Renderer.create(el);
  });
  t.after(() => act(() => root?.unmount()));
  await render(true);
  await render(false);
  await render(true);
  await act(async () => resolve({ currentStage: 2 }));
  assert.equal(current.currentStage, 21);
  await render(true, false);
  assert.equal(current, null);
});

function entriesEnvironment(t) {
  const hook = load("app/(home)/diaryWrite/_hooks/useDiaryEntries.ts", { "../_constants": { MIN_ENTRY_LENGTH: 2 } }).useDiaryEntries;
  let current, root;
  function Probe() { current = hook(); return null; }
  act(() => { root = Renderer.create(React.createElement(Probe)); });
  t.after(() => act(() => root.unmount()));
  return () => current;
}
test("the referenced diary states retain three initial slots, five free slots and seven rewarded slots", (t) => {
  const current = entriesEnvironment(t);
  assert.equal(current().entries.length, 3);
  act(() => { current().addEntry(); current().addEntry(); current().addEntry(); });
  assert.equal(current().entries.length, 5);
  assert.equal(current().canAddEntry, false);
  assert.equal(current().canUnlockAdEntries, true);
  act(() => current().unlockAdEntries());
  assert.equal(current().entries.length, 6);
  assert.equal(current().canUnlockAdEntries, false);
  act(() => { current().addEntry(); current().addEntry(); });
  assert.equal(current().entries.length, 7);
  assert.equal(current().canAddEntry, false);
});
test("dragging and deleting preserve diary text order and at least one slot", (t) => {
  const current = entriesEnvironment(t);
  act(() => current().loadEntries(["first", "second", "third"]));
  act(() => current().moveEntry(2, 0));
  assert.deepEqual(current().entries.map((e) => e.text), ["third", "first", "second"]);
  for (let i = 0; i < 3; i++) act(() => current().removeEntry(current().entries[0].id));
  assert.equal(current().entries.length, 1);
  assert.equal(current().entries[0].text, "second");
});
test("the referenced Korean/English entry inputs enforce distinct limits and show validation only when appropriate", (t) => {
  let root;
  t.after(() => act(() => root?.unmount()));
  for (const [locale, max] of [["ko", 50], ["en", 100]]) {
    const { DiaryEntryInput } = load("app/(home)/diaryWrite/_components/DiaryEntryInput.tsx", {
      "@/app/i18n/i18n": { locale, t: (key) => key },
      "@/shared/components/Icon": { Icon: { IcKebob: "MoreIcon" } },
      "@/shared/components/typo/Typo": { Typo: { Body: "Text", Caption: "Caption" } },
      "@/shared/theme/palette": load("shared/theme/palette.ts"),
      "react-native": { Platform: { OS: "android" }, Pressable: "Button", StyleSheet: { create: (v) => v }, TextInput: "Input", View: "View" },
      "../_constants": { MIN_ENTRY_LENGTH: 2 },
    });
    act(() => {
      root?.unmount(); root = Renderer.create(React.createElement(DiaryEntryInput, { index: 0, value: "a", invalid: false, onChangeText() {}, onPressMore() {} }));
    });
    assert.equal(root.root.findByType("Input").props.maxLength, max);
    const border = () => flatten(root.root.findAllByType("View")[1].props.style).borderColor;
    assert.equal(border(), "#E3E6ED");
    act(() => root.root.findByType("Input").props.onFocus());
    assert.equal(border(), "#00D15A");
    act(() => root.root.findByType("Input").props.onBlur());
    assert.equal(border(), "#F04452");
  }
});

test("Google sign-in is offered only on English screens (including unsupported-language fallback)", () => {
  for (const platform of ["ios", "android"]) {
    for (const language of ["ko", "en", "ja"]) {
      const { getAvailableLoginButtons } = load("shared/utils/loginButtons.ts", {
        "./locale": { getLanguageCode: () => language },
        "./platform": { isIOS: () => platform === "ios", isAndroid: () => platform === "android" },
      });
      const buttons = getAvailableLoginButtons();
      assert.equal(buttons.includes("google"), language !== "ko", `${platform}/${language}`);
      assert.equal(buttons.includes("kakao"), language === "ko");
      assert.equal(buttons.includes("apple"), platform === "ios");
    }
  }
});
