import type { ReplyStatus } from "../types";

export const formatRemainingTime = (ms: number) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export const getCloverColorByCount = (count: number) => {
  if (count <= 0) return "#D1D5DD";
  if (count === 1) return "#8FF76F";
  if (count <= 3) return "#00D15A";
  return "#00974E";
};

export const getDisplayCloverColor = (diaryCount: number, replyStatus: ReplyStatus) => {
  if (replyStatus !== "READY_READ") return "#D1D5DD";
  return getCloverColorByCount(diaryCount);
};
