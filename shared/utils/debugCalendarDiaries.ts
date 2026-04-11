import type { GetCalendarListResponseDTO } from "@/api/dto/list/response/getCalendarListResponseDTO";

/** 개발 빌드에서만 calendar/list 일기 조회값을 콘솔에 출력 */
export function logCalendarDiaryQuery(
  tag: string,
  year: number,
  month: number,
  data: GetCalendarListResponseDTO | undefined,
) {
  if (!__DEV__) return;

  const diaries = data?.diaries ?? [];
  const payload = {
    totalCloverCount: data?.totalCloverCount,
    hasTodayDiary: data?.hasTodayDiary,
    diaryRowCount: diaries.length,
    diaries: diaries.map((d) => ({
      date: d.date,
      diaryCount: d.diaryCount,
      replyStatus: d.replyStatus,
      replyAvailableAt: d.replyAvailableAt,
      isDeleted: d.isDeleted,
      entries: d.diary?.map((e) => e.content) ?? [],
    })),
  };

  console.log(
    `[${tag}] calendar/list ${year}-${String(month).padStart(2, "0")}`,
    JSON.stringify(payload, null, 2),
  );
}
