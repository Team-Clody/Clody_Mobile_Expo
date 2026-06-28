import i18n from "@/app/i18n/i18n";
import {
  WEEK_STRIP_CENTER_INDEX,
  WEEK_STRIP_HALF_SPAN,
} from "../constants";

export const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const weekStripFlatIndexForDate = (picked: Date, anchorToday: Date) => {
  const p = new Date(picked.getFullYear(), picked.getMonth(), picked.getDate());
  const a = new Date(
    anchorToday.getFullYear(),
    anchorToday.getMonth(),
    anchorToday.getDate(),
  );
  const pw = getStartOfWeek(p);
  const aw = getStartOfWeek(a);
  const pu = Date.UTC(pw.getFullYear(), pw.getMonth(), pw.getDate());
  const au = Date.UTC(aw.getFullYear(), aw.getMonth(), aw.getDate());
  const diffWeeks = Math.round((pu - au) / (7 * 86400000));
  return WEEK_STRIP_CENTER_INDEX + diffWeeks;
};

export const formatMonth = (date: Date) => {
  const locale = i18n.locale?.startsWith("ko") ? "ko-KR" : "en-US";
  return date.toLocaleString(locale, {
    month: "long",
    year: "numeric",
  });
};

export const isSameDate = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export const isCalendarToday = (d: Date) => {
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
};

export const startOfLocalDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const isFutureDate = (d: Date) =>
  startOfLocalDay(d) > startOfLocalDay(new Date());

export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

export const buildWeekStrip = (today: Date) => {
  const todayYmd = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  return {
    todayYmd,
    weeks: Array.from({ length: WEEK_STRIP_HALF_SPAN * 2 + 1 }, (_, i) => {
      const start = getStartOfWeek(
        addDays(today, (i - WEEK_STRIP_CENTER_INDEX) * 7),
      );
      return Array.from({ length: 7 }, (_, j) => addDays(start, j));
    }),
  };
};

export const getNumericValue = (value: string) => Number(value.replace(/\D/g, ""));
