import { createAPIRequest, HeaderType } from "@/shared/http";
import type { GetReplyResponseDTO } from "./dto/reply/response/getReplyResponseDTO";

export const ReplyAPI = {
  getReply: async (year: number, month: number, date: number) => {
    const response = await createAPIRequest<GetReplyResponseDTO>(
      "get", "/api/v1/reply", HeaderType.TIME_ZONE, undefined, { params: { year, month, date } },
    );
    return response.data.data;
  },
};
