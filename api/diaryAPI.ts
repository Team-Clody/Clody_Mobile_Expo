import { createAPIRequest, HeaderType } from "@/shared/http";
import type { GetDiaryCreatedTimeResponseDTO } from "./dto/diary/response/getDiaryCreatedTimeResponseDTO";

interface PostDiaryResponse {
  createdAt: string;
  replyType: string; // READY_NOT_READ | DELETED 등 — DELETED면 답장 대기로 가지 않음
  isFromDraft: boolean;
}

export interface GetDiaryResponseDTO {
  diaries: { content: string }[];
  isDeleted: boolean;
  isDraft: boolean;
}

/**
 * POST /diary 전용 날짜 포맷: KST 기준 "yyyy-MM-dd'T'HH:mm:ss" (v1 toKSTDiaryString과 동일한 서버 계약).
 * 날짜는 선택한 일기 날짜, 시각은 현재 시각의 KST 표현.
 */
const toKSTDiaryString = (dateKey: string) => {
  const kstTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
  return `${dateKey}T${kstTime}`;
};

export const DiaryAPI = {
  /** 선택한 날짜의 작성 일기 조회 */
  getDiary: async (year: number, month: number, date: number) => {
    const res = await createAPIRequest<GetDiaryResponseDTO>(
      "get",
      "/api/v1/diary",
      HeaderType.TIME_ZONE,
      undefined,
      { params: { year, month, date } },
    );
    return res.data.data;
  },

  /** 일기 작성 시각 조회 (답장 UNREADY 시 타이머 = 이 시각 + 12시간) */
  getDiaryCreatedTime: async (year: number, month: number, date: number) => {
    const res = await createAPIRequest<GetDiaryCreatedTimeResponseDTO>(
      "get",
      "/api/v1/diary/time",
      HeaderType.TIME_ZONE,
      undefined,
      { params: { year, month, date } },
    );
    return res.data.data;
  },

  /** 일기 전송 (빈 칸은 호출 전에 제거해서 넘길 것) */
  postDiary: async (dateKey: string, contents: string[]) => {
    const res = await createAPIRequest<PostDiaryResponse>(
      "post",
      "/api/v1/diary",
      HeaderType.POST_DIARY,
      { date: toKSTDiaryString(dateKey), content: contents },
    );
    return res.data.data;
  },

  /** 임시저장 — 빈 칸 포함 그대로 저장. date는 "yyyy-MM-dd" (전송과 포맷이 다른 것이 서버 계약) */
  saveDraft: async (dateKey: string, drafts: string[]) => {
    const res = await createAPIRequest<{ createdAt: string }>(
      "post",
      "/api/v1/draft",
      HeaderType.TIME_ZONE,
      { date: dateKey, draftDiaries: drafts },
    );
    return res.data.data;
  },

  /** 임시저장 불러오기 (이어쓰기) — 빈 문자열 항목도 그대로 돌아옴 */
  getDraft: async (year: number, month: number, date: number) => {
    const res = await createAPIRequest<{ draftDiaries: string[] }>(
      "get",
      "/api/v1/draft",
      HeaderType.TIME_ZONE,
      undefined,
      { params: { year, month, date } },
    );
    return res.data.data;
  },
};
