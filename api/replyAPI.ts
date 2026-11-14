import { createAPIRequest, HeaderType } from "@/shared/http";
import { getLanguageCode } from "@/shared/utils/locale";
import { isKoreanTimeZone } from "@/shared/utils/timezone";
import type { GetReplyResponseDTO } from "./dto/reply/response/getReplyResponseDTO";

export type SupportedReplyLanguage =
  | "KO"
  | "KO_US"
  | "EN"
  | "EN_KR"
  | "CHRISTIAN_EN";

export type ReplyAdRequest = {
  year: number;
  month: number;
  date: number;
  supportedLanguage: SupportedReplyLanguage;
};

export type ReplyReadStatus = "UNREADY" | "READY_NOT_READ" | "READY_READ" | "HAS_DRAFT" | "INVALID_DRAFT";
export type ReplyMeta = { replyStatus?: ReplyReadStatus; replyAvailableAt?: string };

export const getSupportedReplyLanguage = (): SupportedReplyLanguage => {
  const isKo = getLanguageCode() === "ko";
  const isKst = isKoreanTimeZone();

  if (isKo) return isKst ? "KO" : "KO_US";
  return isKst ? "EN_KR" : "EN";
};

export const ReplyAPI = {
  /** Unlike GET /reply, the calendar does not mark a reply as read or award a clover. */
  getReplyMeta: async (year: number, month: number, date: number): Promise<ReplyMeta | null> => {
    const response = await createAPIRequest<{ diaries: (ReplyMeta & { date: string })[] }>(
      "get", "/api/v1/calendar/list", HeaderType.TIME_ZONE, undefined, { params: { year, month } },
    );
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
    return response.data.data.diaries.find((day) => day.date === dateKey) ?? null;
  },

  getReply: async (year: number, month: number, date: number) => {
    const response = await createAPIRequest<GetReplyResponseDTO>(
      "get", "/api/v1/reply", HeaderType.TIME_ZONE, undefined, { params: { year, month, date } },
    );
    return response.data.data;
  },

  startAdViewing: async (request: ReplyAdRequest) => {
    const response = await createAPIRequest<void>(
      "post",
      "/api/v1/reply/ad/start",
      HeaderType.TIME_ZONE_LANGUAGE,
      request,
    );
    return response.data.data;
  },

  endAdViewing: async (request: ReplyAdRequest) => {
    const response = await createAPIRequest<void>(
      "patch",
      "/api/v1/reply/ad/end",
      HeaderType.TIME_ZONE_LANGUAGE,
      request,
    );
    return response.data.data;
  },
};
