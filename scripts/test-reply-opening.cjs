const assert = require("node:assert/strict");
const test = require("node:test");
const load = require("./helpers/load-typescript.cjs");

function environment({ status = "READY_NOT_READ", content = "A reply", failMeta = false, failClover = false } = {}) {
  const calls = [];
  let read = status === "READY_READ";
  const api = {
    async getReplyMeta() { calls.push("meta"); if (failMeta) throw Error("offline"); return { replyStatus: read ? "READY_READ" : status }; },
    async getReply() { calls.push("reply"); read = true; return { content, isRead: true }; },
  };
  const service = load("services/replyOpenService.ts", {
    "@/shared/clover/cloverProgress": load("shared/clover/cloverProgress.ts"),
    "@/api/replyAPI": { ReplyAPI: api },
    "@/api/cloverAPI": { CloverAPI: { async getCloverInfo() { calls.push("clover"); if (failClover) throw Error("offline"); return { cloverCount: 1, stage: 1 }; } } },
  });
  return { calls, ...service, open: (fallback) => service.openReplyWithReward(2026, 11, 14, fallback) };
}

test("an unread reply earns the popup even when the server returns isRead=true", async () => {
  const env = environment();
  const result = await env.open();
  assert.equal(result.firstRead, true);
  assert.equal(result.reply.isRead, true);
  assert.deepEqual(await result.progressPromise, { level: 1, completed: 1, required: 2 });
  assert.deepEqual(env.calls, ["meta", "reply", "clover"]);
});

test("reopening a previously read reply does not repeat the reward", async () => {
  const env = environment();
  await env.open();
  const reopened = await env.open("READY_NOT_READ");
  assert.equal(reopened.firstRead, false);
  assert.equal(env.calls.filter((name) => name === "clover").length, 1);
});

test("an already read reply never uses stale unread navigation data for a reward", async () => {
  const env = environment({ status: "READY_READ" });
  assert.equal((await env.open("READY_NOT_READ")).firstRead, false);
  assert.deepEqual(env.calls, ["meta", "reply"]);
});

test("an ad-unlocked reply can be first-read while its prior status is UNREADY", async () => {
  assert.equal((await environment({ status: "UNREADY" }).open()).firstRead, true);
});

test("empty or still-generating content cannot produce a reward", async () => {
  for (const content of [null, "", "  \n  "]) {
    const env = environment({ content });
    assert.equal((await env.open()).firstRead, false);
    assert.deepEqual(env.calls, ["meta", "reply"]);
  }
});

test("a failed metadata refresh retains a known navigation status", async () => {
  const env = environment({ failMeta: true });
  assert.equal((await env.open("READY_NOT_READ")).firstRead, true);
});

test("unknown read history is not advertised as a new reward", async () => {
  assert.equal((await environment({ failMeta: true }).open()).firstRead, false);
});

test("a failed clover summary does not prevent opening a valid reply", async () => {
  const result = await environment({ failClover: true }).open();
  assert.equal(result.firstRead, true);
  assert.equal(await result.progressPromise, null);
  assert.equal(result.reply.content, "A reply");
});

test("reward progress follows the server's 2-clover then 14-clover stages", () => {
  const { getCloverMissionProgress: progress } = environment();
  for (const [count, expected] of [
    [0, [1, 0, 2]], [1, [1, 1, 2]], [2, [2, 0, 2]],
    [9, [5, 1, 2]], [10, [6, 0, 14]], [23, [6, 13, 14]],
    [24, [7, 0, 14]], [234, [21, 14, 14]], [235, [21, 14, 14]],
  ]) {
    assert.deepEqual(Object.values(progress(count)), expected);
  }
});

test("reply preview reads the calendar and matches a zero-padded date without reading the reply", async () => {
  const calls = [];
  const { ReplyAPI } = load("api/replyAPI.ts", {
    "@/shared/http": {
      HeaderType: { TIME_ZONE: "time-zone" },
      createAPIRequest: async (...args) => {
        calls.push(args);
        return { data: { data: { diaries: [
          { date: "2026-11-03", replyStatus: "READY_READ" },
          { date: "2026-11-04", replyStatus: "READY_NOT_READ" },
        ] } } };
      },
    },
    "@/shared/utils/locale": { getLanguageCode: () => "ko" },
    "@/shared/utils/timezone": { isKoreanTimeZone: () => true },
  });
  assert.equal((await ReplyAPI.getReplyMeta(2026, 11, 4)).replyStatus, "READY_NOT_READ");
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], ["get", "/api/v1/calendar/list", "time-zone", undefined, { params: { year: 2026, month: 11 } }]);
});
