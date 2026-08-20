import type { GetJournalPromptResponseDTO } from "@/api/dto/list/response/getJournalPromptResponseDTO";
import { createAPIRequest, HeaderType } from "@/shared/http";
import { getDeviceLocale } from "@/shared/utils/locale";

export const JournalPromptAPI = {
  getToday: async (month: number, date: number) => {
    const response = await createAPIRequest<GetJournalPromptResponseDTO>(
      "get",
      "/api/v1/journal/prompt",
      HeaderType.TIME_ZONE,
      undefined,
      {
        params: { month, date },
        headers: { "Accept-Language": getDeviceLocale() },
      },
    );
    return response.data.data;
  },
};
