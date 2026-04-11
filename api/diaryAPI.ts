import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { getDeviceTimeZone } from "@/shared/utils/timezone";
import type { GetDiaryCreatedTimeResponseDTO } from "./dto/diary/response/getDiaryCreatedTimeResponseDTO";

const BASE_URL = "https://test.clodycorp.com";

export const DiaryAPI = {
  /** 일기 작성 시각 조회 (답장 UNREADY 시 타이머 = 이 시각 + 12시간) */
  getDiaryCreatedTime: async (year: number, month: number, date: number) => {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (!accessToken) throw new Error("accessToken이 없습니다.");
    const res = await axios.get<{ data: GetDiaryCreatedTimeResponseDTO }>(
      `${BASE_URL}/api/v1/diary/time`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Time-Zone": getDeviceTimeZone(),
        },
        params: { year, month, date },
      },
    );
    return res.data.data;
  },
};
