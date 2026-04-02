import { createAPIRequest, HeaderType } from '@/shared/http';
import { GetJournalPromptResponseDTO } from './dto/list/response/getJournalPromptResponseDTO';
import { GetCalendarListResponseDTO } from './dto/list/response/getCalendarListResponseDTO';

export const ListAPI = {
  getJournalPrompt: async (month: number, date: number) => {
    const resp = await createAPIRequest<GetJournalPromptResponseDTO>(
      'get',
      '/api/v1/journal/prompt',
      HeaderType.TIME_ZONE,
      undefined,
      { params: { month, date } },
    );
    return resp.data.data;
  },

  getCalendarList: async (year: number, month: number) => {
    const resp = await createAPIRequest<GetCalendarListResponseDTO>(
      'get',
      '/api/v1/calendar/list',
      HeaderType.TIME_ZONE,
      undefined,
      { params: { year, month } },
    );
    return resp.data.data;
  },
};
