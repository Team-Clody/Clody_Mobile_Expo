import type { CalendarDiary } from "../types";
import { formatDateKey, getDaysInMonth, startOfLocalDay } from "./dateUtils";

export const zeroDiaryCountsAfterToday = (map: Record<string, number>) => {
  const todayStart = startOfLocalDay(new Date());
  const next = { ...map };
  for (const key of Object.keys(next)) {
    const parts = key.split("-");
    if (parts.length !== 3) continue;
    const y = Number(parts[0]);
    const mo = Number(parts[1]);
    const da = Number(parts[2]);
    if (!y || !mo || !da) continue;
    const d = startOfLocalDay(new Date(y, mo - 1, da));
    if (d > todayStart) {
      next[key] = 0;
    }
  }
  return next;
};

export const buildDiaryCountMap = (diaries: CalendarDiary[]) => {
  const diaryCountMap = diaries.reduce<Record<string, number>>((acc, diaryItem) => {
    acc[diaryItem.date] = diaryItem.diaryCount ?? 0;
    return acc;
  }, {});
  return zeroDiaryCountsAfterToday(diaryCountMap);
};

export const buildReplyMetaMaps = (diaries: CalendarDiary[]) => {
  const replyStatusByDate: Record<string, import("../types").ReplyStatus> = {};
  const replyReadyAtByDate: Record<string, number> = {};
  for (const diaryItem of diaries) {
    if (diaryItem.replyStatus) {
      replyStatusByDate[diaryItem.date] = diaryItem.replyStatus;
    }
    if (diaryItem.replyAvailableAt) {
      const t = Date.parse(diaryItem.replyAvailableAt);
      if (!Number.isNaN(t)) {
        replyReadyAtByDate[diaryItem.date] = t;
      }
    }
  }
  return { replyStatusByDate, replyReadyAtByDate };
};

export const getMonthMatrix = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const matrix = [];
  let current = 1 - (startDay === 0 ? 6 : startDay - 1);

  for (let row = 0; row < 6; row++) {
    const week = [];
    for (let col = 0; col < 7; col++) {
      week.push(new Date(year, month, current));
      current++;
    }
    matrix.push(week);
  }

  return matrix;
};

export { formatDateKey, getDaysInMonth };
