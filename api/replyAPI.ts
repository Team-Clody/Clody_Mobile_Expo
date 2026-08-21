import { createAPIRequest, HeaderType } from "@/shared/http";
import type { GetReplyResponseDTO } from "./dto/reply/response/getReplyResponseDTO";

export type SupportedReplyLanguage = "KO" | "EN" | "CHRISTIAN_EN";

export type ReplyAdRequest = {
  year: number;
  month: number;
  date: number;
  supportedLanguage: SupportedReplyLanguage;
};

export const ReplyAPI = {
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
      HeaderType.TIME_ZONE,
      request,
    );
    return response.data.data;
  },

  endAdViewing: async (request: ReplyAdRequest) => {
    const response = await createAPIRequest<void>(
      "patch",
      "/api/v1/reply/ad/end",
      HeaderType.TIME_ZONE,
      request,
    );
    return response.data.data;
  },
};
