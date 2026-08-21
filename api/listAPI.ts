import type { GetCalendarListResponseDTO } from "@/api/dto/list/response/getCalendarListResponseDTO";
import { createAPIRequest, HeaderType } from "@/shared/http";
import { logCalendarDiaryQuery } from "@/shared/utils/debugCalendarDiaries";

export const ListAPI = {
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
