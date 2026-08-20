import { createAPIRequest, HeaderType } from "@/shared/http";

export type SupportedReplyLanguage = "KO" | "EN" | "CHRISTIAN_EN";

export type ReplyAdRequest = {
  year: number;
  month: number;
  date: number;
  supportedLanguage: SupportedReplyLanguage;
};

export const ReplyAPI = {
  startAdViewing: async (request: ReplyAdRequest) => {
    const res = await createAPIRequest<void>(
      "post",
      "/api/v1/reply/ad/start",
      HeaderType.TIME_ZONE,
      request,
    );
    return res.data.data;
  },

  endAdViewing: async (request: ReplyAdRequest) => {
    const res = await createAPIRequest<void>(
      "patch",
      "/api/v1/reply/ad/end",
      HeaderType.TIME_ZONE,
      request,
    );
    return res.data.data;
  },
};
