const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const Renderer = require("react-test-renderer");
const load = require("./helpers/load-typescript.cjs");
global.IS_REACT_ACT_ENVIRONMENT = true;

async function screen(t, { alreadyRead = false, content = "A real reply", cloverRequest } = {}) {
  const calls = [];
  const status = () => alreadyRead ? "READY_READ" : "READY_NOT_READ";
  const navigationStatus = status();
  const replyAPI = {
    async getReplyMeta() { calls.push("meta"); return { replyStatus: status() }; },
    async getReply() { calls.push("reply"); alreadyRead = true; return { nickname: "QA", content, isRead: true }; },
  };
  const service = load("services/replyOpenService.ts", {
    "@/shared/clover/cloverProgress": load("shared/clover/cloverProgress.ts"),
    "@/api/replyAPI": { ReplyAPI: replyAPI },
    "@/api/cloverAPI": { CloverAPI: { async getCloverInfo() { calls.push("clover"); return cloverRequest ?? { cloverCount: 1, stage: 1 }; } } },
  });
  const empty = () => null;
  const ad = { isEarnedReward: false, isClosed: false, isShowing: false, isLoaded: false, error: null };
  const { default: ReplyScreen } = load("app/(home)/reply/[date].tsx", {
    "@/api/diaryAPI": { DiaryAPI: {
      getDiary: async () => ({ diaries: [], isDeleted: false, isDraft: false }),
      getDiaryCreatedTime: async () => ({ date: "2026-11-14" }),
    } },
    "@/api/replyAPI": { ReplyAPI: replyAPI, getSupportedReplyLanguage: () => "KO" },
    "@/app/i18n/i18n": { __esModule: true, default: { t: (key) => key, locale: "ko" } },
    "@/assets/icons/ic_back.svg": empty,
    "@/assets/icons/ic_chevron_green.svg": empty,
    "@/assets/images/lody_head.svg": empty,
    "@/shared/ads": { useAdMobRewarded: () => ad },
    "@/shared/components/DeleteActionSheet": { DeleteActionSheet: empty },
    "@/shared/components/Toast": { Toast: empty },
    "@/shared/components/modal/CloverRewardModal": { CloverRewardModal: "RewardModal" },
    "@/services/replyOpenService": service,
    "@/shared/theme/palette": load("shared/theme/palette.ts"),
    "@/shared/theme/typography": load("shared/theme/typography.ts"),
    "@/shared/utils/diaryReplyTimer": { diaryCreatedToReplyReadyMs: () => Date.now() - 1000 },
    "expo-router": {
      useRouter: () => ({ back() {} }),
      useLocalSearchParams: () => ({ date: "2026-11-14", status: navigationStatus }),
    },
    "react-native": {
      ActivityIndicator: "ActivityIndicator", Pressable: "Pressable", ScrollView: "ScrollView", Text: "Text", View: "View",
      StyleSheet: { create: (value) => value, hairlineWidth: 0.5 },
      useWindowDimensions: () => ({ width: 390, height: 844 }),
    },
    "react-native-pager-view": { __esModule: true, default: React.forwardRef(function Pager(props, ref) { return React.createElement("PagerView", { ...props, ref }); }) },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
  });
  let root;
  await React.act(async () => { root = Renderer.create(React.createElement(ReplyScreen)); });
  t.after(() => React.act(() => root.unmount()));
  const openButton = () => root.root.findAllByType("Pressable").find((node) =>
    node.findAllByType("Text").some((text) => text.props.children === "reply.ready.open"));
  const reward = () => root.root.findByType("RewardModal").props;
  return { calls, root, openButton, reward };
}

test("mounting an unread ready reply never consumes it through a background prefetch", async (t) => {
  const env = await screen(t);
  assert.deepEqual(env.calls, ["meta"]);
  assert.ok(env.openButton());
  assert.equal(env.reward().visible, false);
});

test("explicit open shows the first-read popup exactly once despite a true response and repeated taps", async (t) => {
  const env = await screen(t);
  const open = env.openButton().props.onPress;
  await React.act(async () => { open(); open(); });
  assert.equal(env.calls.filter((call) => call === "reply").length, 1);
  assert.equal(env.reward().visible, true);
  assert.deepEqual(env.reward().progress, { level: 1, completed: 1, required: 2 });
  await React.act(async () => env.reward().onConfirm());
  assert.equal(env.reward().visible, false);
});

test("an already read reply opens its content without a new clover popup", async (t) => {
  const env = await screen(t, { alreadyRead: true });
  assert.equal(env.openButton(), undefined);
  assert.equal(env.reward().visible, false);
  assert.deepEqual(env.calls, ["meta", "reply"]);
});

test("an unfinished reply remains retryable and cannot show a reward", async (t) => {
  const env = await screen(t, { content: null });
  await React.act(async () => env.openButton().props.onPress());
  assert.equal(env.reward().visible, false);
  assert.equal(env.openButton().props.disabled, false);
});

test("a slow clover summary does not block the letter or first-read popup", async (t) => {
  let finishSummary;
  const cloverRequest = new Promise((resolve) => { finishSummary = resolve; });
  const env = await screen(t, { cloverRequest });
  await React.act(async () => env.openButton().props.onPress());
  assert.equal(env.reward().visible, true);
  assert.equal(env.reward().progress, null);
  assert.ok(env.root.root.findAllByType("Text").some((node) => node.props.children === "A real reply"));
  await React.act(async () => finishSummary({ cloverCount: 1, stage: 1 }));
  assert.deepEqual(env.reward().progress, { level: 1, completed: 1, required: 2 });
});
