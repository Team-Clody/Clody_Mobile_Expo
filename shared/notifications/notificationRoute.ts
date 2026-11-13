export type NotificationRoute =
  | "/(home)/(tabs)/main"
  | "/(home)/diaryWrite"
  | {
      pathname: "/(home)/reply/[date]";
      params: { date: string; status: "READY_NOT_READ" };
    };

function isDiaryDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

/** Only documented notification types can select a screen; URLs are never opened. */
export function getNotificationRoute(
  data: Record<string, unknown> | undefined,
): NotificationRoute {
  if (data?.type === "reply" && isDiaryDate(data.date)) {
    return {
      pathname: "/(home)/reply/[date]",
      params: { date: data.date, status: "READY_NOT_READ" },
    };
  }

  if (data?.type === "diary" || data?.type === "diary_reminder") {
    return "/(home)/diaryWrite";
  }

  return "/(home)/(tabs)/main";
}
