import { CloverAPI } from "@/api/cloverAPI";
import { ReplyAPI, type ReplyReadStatus } from "@/api/replyAPI";
import { getCloverProgress } from "@/shared/clover/cloverProgress";

export function getCloverMissionProgress(cloverCount: number) {
  const { level, completed, required } = getCloverProgress(cloverCount);
  return { level, completed, required };
}

export class ReplyUnavailableError extends Error {
  constructor() {
    super("Replies are not available for rewritten journals.");
    this.name = "ReplyUnavailableError";
  }
}

/** Called only for an explicit open: GET /reply consumes the unread status. */
export async function openReplyWithReward(
  year: number,
  month: number,
  date: number,
  fallbackStatus?: ReplyReadStatus,
) {
  const meta = await ReplyAPI.getReplyMeta(year, month, date).catch(() => null);
  if (meta?.isDeleted === true) throw new ReplyUnavailableError();
  const previousStatus = meta?.replyStatus ?? fallbackStatus;
  const reply = await ReplyAPI.getReply(year, month, date);
  const firstRead = Boolean(reply.content?.trim()) &&
    (previousStatus === "READY_NOT_READ" || previousStatus === "UNREADY");
  // Opening the letter must not wait for the optional reward summary request.
  const progressPromise = firstRead
    ? CloverAPI.getCloverInfo().then((info) => getCloverMissionProgress(info.cloverCount)).catch(() => null)
    : Promise.resolve(null);
  return {
    reply,
    firstRead,
    progressPromise,
  };
}
