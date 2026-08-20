import type { GetCalendarListResponseDTO } from "@/api/dto/list/response/getCalendarListResponseDTO";
import type { GetJournalPromptResponseDTO } from "@/api/dto/list/response/getJournalPromptResponseDTO";
import { createAPIRequest, HeaderType } from "@/shared/http";
import { logCalendarDiaryQuery } from "@/shared/utils/debugCalendarDiaries";
import { getDeviceLocale } from "@/shared/utils/locale";

export const ListAPI = {
  getJournalPrompt: async (month: number, date: number) => {
    const res = await createAPIRequest<GetJournalPromptResponseDTO>(
      "get",
      "/api/v1/journal/prompt",
      HeaderType.TIME_ZONE,
      undefined,
      {
        params: { month, date },
        headers: { "Accept-Language": getDeviceLocale() },
      },
    );
    return res.data.data;
  },

  getCalendarList: async (year: number, month: number) => {
    const res = await createAPIRequest<GetCalendarListResponseDTO>(
      "get",
      "/api/v1/calendar/list",
      HeaderType.TIME_ZONE,
      undefined,
      { params: { year, month } },
    );
    const data = res.data.data;
    logCalendarDiaryQuery("ListAPI.getCalendarList", year, month, data);
    return data;
  },
};
