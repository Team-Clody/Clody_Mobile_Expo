import { getDeviceTimeZone } from "./timezone";

/** 일기 작성 가능일: KST 사용자는 오늘+어제, 그 외 타임존은 오늘만 (v1 정책) */
export const isDiaryWritableDate = (date: Date) => {
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round(
    (startOf(new Date()) - startOf(date)) / 86400000,
  );
  const isKST = getDeviceTimeZone() === "Asia/Seoul";
  return isKST ? diffDays === 0 || diffDays === 1 : diffDays === 0;
};
