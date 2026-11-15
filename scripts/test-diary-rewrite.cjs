const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const Renderer = require("react-test-renderer");
const load = require("./helpers/load-typescript.cjs");
global.IS_REACT_ACT_ENVIRONMENT = true;
const empty = () => null;
const i18n = { __esModule: true, default: { locale: "ko", t: (key) => key } };
const constants = {
  WEEK_STRIP_CENTER_INDEX: 1, WEEK_STRIP_HALF_SPAN: 1, WEEK_STRIP_LENGTH: 3,
  SCREEN_WIDTH: 390, WEEK_DAYS_KO: [], WEEK_DAYS_EN: [], EN_MONTH_ITEMS: [],
};
const dates = load("app/(home)/(tabs)/main/_utils/dateUtils.ts", {
  "@/app/i18n/i18n": i18n, "../_constants": constants,
});
const calendarUtils = load("app/(home)/(tabs)/main/_utils/calendarDataUtils.ts", { "./dateUtils": dates });
const native = {
  View: "View", Text: "Text", Pressable: "Pressable", ScrollView: "ScrollView", Modal: "Modal",
  StyleSheet: { create: (value) => value, hairlineWidth: 0.5 },
  Animated: { Value: class {}, }, PanResponder: { create: () => ({ panHandlers: {} }) },
};
const { GratitudeCard } = load("app/(home)/(tabs)/main/_components/GratitudeCard.tsx", {
  "react-native": native, "@/app/i18n/i18n": i18n,
  "@/assets/icons/ic_prompt.svg": "PromptIcon", "@/assets/icons/Vector_gr.svg": empty,
  "@/assets/icons/Vector_bk.svg": empty, "@/assets/icons/ic_new.svg": "NewIcon",
  "@/assets/icons/btn_ad_to_reply_ko.svg": "ReplyAd", "@/assets/icons/btn_ad_to_reply_en.svg": "ReplyAd",
  "@/components/GradientText": { GradientText: "Text" },
  "@/shared/theme/localeTypography": { fontPreset: {} }, "../_constants": constants,
  "../_utils/dateUtils": dates,
});

for (const today of [true, false]) {
  test(`${today ? "today" : "yesterday"} waiting card ${today ? "shows" : "hides"} prompt and divider, retaining an eligible reply ad`, async (t) => {
    const date = new Date();
    if (!today) date.setDate(date.getDate() - 1);
    let root;
    await React.act(async () => { root = Renderer.create(React.createElement(GratitudeCard, {
      gratitudeDate: date, isKo: true, isUnready: true, journalPromptText: "Prompt",
      onPressAction: empty, onPressFastReplyAd: empty,
    })); });
    t.after(() => React.act(() => root.unmount()));
    assert.equal(root.root.findAllByProps({ testID: "journal-prompt-divider" }).length, today ? 1 : 0);
    assert.equal(root.root.findAllByType("PromptIcon").length, today ? 1 : 0);
    assert.equal(root.root.findAllByType("ReplyAd").length, 1);
  });
}

async function home(t, initialRows) {
  let rows = initialRows;
  const Focus = React.createContext(true);
  const useFocusEffect = (callback) => {
    const focused = React.useContext(Focus);
    React.useEffect(() => focused ? callback() : undefined, [focused, callback]);
  };
  const { useMainCalendarData } = load("app/(home)/(tabs)/main/_hooks/useMainCalendarData.ts", {
    "expo-router": { useFocusEffect },
    "expo-secure-store": { getItemAsync: async () => "test-token" },
    "axios": { __esModule: true, default: { get: async (_url, { params }) => ({ data: { data: {
      diaries: rows.filter((row) => row.date.startsWith(`${params.year}-${String(params.month).padStart(2, "0")}-`)),
      totalCloverCount: 1,
    } } }) }, isAxiosError: () => false },
    "@/shared/utils/debugCalendarDiaries": { logCalendarDiaryQuery: empty },
    "@/shared/utils/timezone": { getDeviceTimeZone: () => "Asia/Seoul" },
    "@/services/authService": {}, "../_utils/calendarDataUtils": calendarUtils,
  });
  const navigation = [];
  const calls = [];
  const storage = { shouldReopenReward: false, pendingToast: null, setShouldReopenReward: empty, setPendingToast: empty };
  const { default: Main } = load("app/(home)/(tabs)/main/index.tsx", {
    "react-native": native, "expo-router": { useFocusEffect, useRouter: () => ({ push: (route) => navigation.push(route) }) },
    "@/shared/skins/useCloverSummary": { useCloverSummary: () => null },
    "@/shared/skins/useEquippedSkin": { useEquippedSkin: () => null },
    "@/assets/icons/weekday-item_ko.svg": empty, "@/assets/icons/weekday-item_en.svg": empty,
    "@/api/replyAPI": { getSupportedReplyLanguage: () => "KO", ReplyAPI: { startAdViewing: async () => calls.push("ad-start") } },
    "@/components/CloverRewardBottomSheet": { __esModule: true, default: empty },
    "@/app/i18n/i18n": i18n,
    "@/shared/ads": { useAdMobRewarded: () => ({ isLoaded: true, showAd: () => calls.push("ad-show") }) },
    "@/shared/components/Toast": { Toast: empty },
    "@/store/useAppStore": { useApp: () => ({ isLoggedIn: true, authReady: true }) },
    "@/store/useStorageStore": { useStorageStore: (select) => select(storage) },
    "../../_layout": { HomeContext: React.createContext(null) },
    "./_components/CharacterScene": { CharacterScene: empty },
    "./_components/DatePickerSheet": { DatePickerSheet: empty },
    "./_components/GratitudeCard": { GratitudeCard: "GratitudeCard" },
    "./_components/MainHeader": { MainHeader: "MainHeader" },
    "./_components/MonthlyCalendarSheet": { MonthlyCalendarSheet: empty },
    "./_constants": constants,
    "@/shared/theme/localeTypography": { localeTextStyle: empty },
    "./_hooks/useJournalPrompt": { useJournalPrompt: empty },
    "./_hooks/useMainCalendarData": { useMainCalendarData },
    "./_hooks/useReplyReadyTime": { useReplyReadyTime: empty },
    "@/shared/diary/useSelectedDraft": { useSelectedDraft: () => false },
    "@/shared/clover/cloverProgress": load("shared/clover/cloverProgress.ts"),
    "./_utils/calendarDataUtils": calendarUtils,
    "./_utils/cloverUtils": load("app/(home)/(tabs)/main/_utils/cloverUtils.ts"),
    "./_utils/dateUtils": dates,
    "@/shared/utils/diaryDate": load("shared/utils/diaryDate.ts", { "./timezone": { getDeviceTimeZone: () => "Asia/Seoul" } }),
  });
  let root;
  const render = async (focused = true) => React.act(async () => {
    const element = React.createElement(Focus.Provider, { value: focused }, React.createElement(Main));
    if (root) root.update(element); else root = Renderer.create(element);
  });
  await render();
  t.after(() => React.act(() => root.unmount()));
  return {
    root, navigation, calls, card: () => root.root.findByType("GratitudeCard").props,
    select: (date) => React.act(() => root.root.findByType("MainHeader").props.onSelectDate(date)),
    refresh: async (next) => { await render(false); rows = next; await render(true); },
  };
}

for (const replyStatus of ["UNREADY", "READY_NOT_READ", "READY_READ"]) {
  test(`calendar ${replyStatus} rewrite becomes View Journal with no ad or new badge`, async (t) => {
    const date = dates.formatDateKey(new Date());
    const env = await home(t, [{ date, diaryCount: 3, replyStatus, isDeleted: true }]);
    assert.equal(env.card().actionLabel, "reply.viewDiary");
    assert.equal(env.card().isUnready, false);
    assert.equal(env.card().isReadyNotRead, false);
    await React.act(async () => env.card().onPressFastReplyAd());
    assert.deepEqual(env.calls, []);
    await React.act(async () => env.card().onPressAction());
    assert.equal(env.navigation[0].params.tab, "diary");
    assert.equal(env.navigation[0].params.replyUnavailable, "true");
  });
}

test("a deleted empty date can be written again; the unavailable state stays scoped to its own date", async (t) => {
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const env = await home(t, [
    { date: dates.formatDateKey(today), diaryCount: 0, replyStatus: "READY_READ", isDeleted: true },
    { date: dates.formatDateKey(yesterday), diaryCount: 3, replyStatus: "READY_NOT_READ", isDeleted: false },
  ]);
  assert.equal(env.card().actionLabel, "main.gratitude.writeEntry");
  await React.act(async () => env.card().onPressAction());
  assert.equal(env.navigation[0].pathname, "/(home)/diaryWrite");
  await env.select(yesterday);
  assert.equal(env.card().actionLabel, "답장확인");
  assert.equal(env.card().isReadyNotRead, true);
});

test("returning home replaces stale deletion flags with the refreshed month", async (t) => {
  const date = dates.formatDateKey(new Date());
  const row = { date, diaryCount: 3, replyStatus: "READY_NOT_READ" };
  const env = await home(t, [{ ...row, isDeleted: true }]);
  assert.equal(env.card().actionLabel, "reply.viewDiary");
  await env.refresh([{ ...row, isDeleted: false }]);
  assert.equal(env.card().actionLabel, "답장확인");
  assert.equal(env.card().isReadyNotRead, true);
});

test("list entries distinguish rewritten journals from regular replies and pass their availability on navigation", async (t) => {
  const { DiaryList } = load("components/list/DiaryList.tsx", {
    "@/app/i18n/i18n": i18n,
    "@/shared/components/Icon": { Icon: new Proxy({}, { get: () => empty }) },
    "@/shared/components/stack/HStack": { HStack: "View" },
    "@/shared/components/typo/Typo": { Typo: { Body: "Text" } },
    "@/shared/theme/palette": load("shared/theme/palette.ts"), "@/shared/utils/locale": { isKoreanLocale: () => true },
    "./PromptHeader": { PromptHeader: empty },
    "react-native": { ...native, RefreshControl: empty, FlatList: ({ data, renderItem }) => React.createElement("View", null,
      data.map((item) => React.createElement(React.Fragment, { key: item.date }, renderItem({ item })))) },
  });
  const calls = [];
  let root;
  await React.act(async () => { root = Renderer.create(React.createElement(DiaryList, {
    diaries: [
      { date: "2026-11-13", diaryCount: 3, replyStatus: "UNREADY", isDeleted: true, diary: [] },
      { date: "2026-11-14", diaryCount: 3, replyStatus: "READY_READ", isDeleted: false, diary: [] },
    ], onPressReply: (...args) => calls.push(args),
  })); });
  t.after(() => React.act(() => root.unmount()));
  const journal = root.root.findByProps({ accessibilityLabel: "reply.viewDiary" });
  const reply = root.root.findByProps({ accessibilityLabel: "list.reply" });
  await React.act(async () => { journal.props.onPress(); reply.props.onPress(); });
  assert.deepEqual(calls, [["2026-11-13", true], ["2026-11-14", false]]);
});

for (const replyStatus of ["UNREADY", "READY_NOT_READ", "READY_READ"]) {
  test(`a normal ${replyStatus} journal never displays View Journal or disables replies`, async (t) => {
    const date = dates.formatDateKey(new Date());
    const env = await home(t, [{ date, diaryCount: 3, replyStatus, isDeleted: false }]);
    assert.notEqual(env.card().actionLabel, "reply.viewDiary");
    if (replyStatus === "UNREADY") {
      assert.equal(env.card().isUnready, true);
    } else {
      assert.equal(env.card().actionLabel, "답장확인");
      assert.equal(env.card().isUnready, false);
      await React.act(async () => env.card().onPressAction());
      assert.equal(env.navigation[0].params.replyUnavailable, undefined);
      assert.equal(env.navigation[0].params.tab, undefined);
    }
  });
}
