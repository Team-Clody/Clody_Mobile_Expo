import { createAPIRequest, HeaderType } from '@/shared/http';
import { PostAlarmRequestDTO } from './dto/request/postAlarmRequestDTO';
import { PostAlarmSetResponseDTO } from './dto/myPage/response/postAlarmSetResponseDTO';

export const AlarmAPI = {
  postAlarm: async (requestDTO: PostAlarmRequestDTO) => {
    const resp = await createAPIRequest<PostAlarmSetResponseDTO>(
      'post',
      '/api/v1/alarm',
      HeaderType.ACCESS_TOKEN,
      requestDTO,
    );
    return resp.data;
  },
  updateFcmToken: async (fcmToken: string, signal?: AbortSignal) => {
    await createAPIRequest<PostAlarmSetResponseDTO>(
      'post',
      '/api/v1/alarm',
      HeaderType.ACCESS_TOKEN,
      { fcmToken },
      { signal },
    );
  },
};
