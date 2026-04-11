import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { logCalendarDiaryQuery } from '@/shared/utils/debugCalendarDiaries';
import { GetJournalPromptResponseDTO } from './dto/list/response/getJournalPromptResponseDTO';
import { GetCalendarListResponseDTO } from './dto/list/response/getCalendarListResponseDTO';

const BASE_URL = 'https://test.clodycorp.com';

const getAuthHeaders = async () => {
  const accessToken = await SecureStore.getItemAsync('accessToken');
  if (!accessToken) throw new Error('accessToken이 없습니다.');
  return {
    Authorization: `Bearer ${accessToken}`,
    'Time-Zone': 'Asia/Seoul',
  };
};

export const ListAPI = {
  getJournalPrompt: async (month: number, date: number) => {
    const headers = await getAuthHeaders();
    const res = await axios.get<{ data: GetJournalPromptResponseDTO }>(
      `${BASE_URL}/api/v1/journal/prompt`,
      { params: { month, date }, headers },
    );
    return res.data.data;
  },

  getCalendarList: async (year: number, month: number) => {
    const headers = await getAuthHeaders();
    const res = await axios.get<{ data: GetCalendarListResponseDTO }>(
      `${BASE_URL}/api/v1/calendar/list`,
      { params: { year, month }, headers },
    );
    const data = res.data.data;
    logCalendarDiaryQuery('ListAPI.getCalendarList', year, month, data);
    return data;
  },
};
