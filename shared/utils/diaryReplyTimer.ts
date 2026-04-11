import type { GetDiaryCreatedTimeResponseDTO } from "@/api/dto/diary/response/getDiaryCreatedTimeResponseDTO";

/** 일기 작성 후 답장 오픈까지 대기 시간 (백엔드 규칙과 동일) */
export const DIARY_REPLY_READY_AFTER_MS = 12 * 60 * 60 * 1000;

/**
 * diary/time 응답(로컬 날짜 + 시분초)을 기기 로컬 타임존 기준 타임스탬프로 해석한 뒤,
 * 답장 가능 시각(ms)을 반환합니다.
 */
export function diaryCreatedToReplyReadyMs(
  data: GetDiaryCreatedTimeResponseDTO,
): number | null {
  const parts = data.date.split("-").map((s) => Number(s.trim()));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return null;
  }
  const [y, mo, d] = parts;
  const created = new Date(y, mo - 1, d, data.HH, data.mm, data.ss);
  const t = created.getTime();
  if (Number.isNaN(t)) {
    return null;
  }
  return t + DIARY_REPLY_READY_AFTER_MS;
}
