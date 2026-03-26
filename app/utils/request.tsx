import * as SecureStore from "expo-secure-store";
import axios from "axios";
import authService from "@/services/authService";
const BASE_URL = "https://test.clodycorp.com";

// ✅ 공통 요청 함수
export const request = async (url, method = "GET", body = null) => {
  try {
    let accessToken = await SecureStore.getItemAsync("accessToken");

    const res = await axios({
      method,
      url: `${BASE_URL}${url}`,
      data: body,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data;
  } catch (error) {
    try {
      const status = error.response?.status;
      switch (true) {
        case status === 401:
          console.log("토큰 만료 → refresh");
          try {
            const refreshToken = await SecureStore.getItemAsync("refreshToken");
            await authService.reissueWithRefreshToken(refreshToken);
            const accessToken = await SecureStore.getItemAsync("accessToken");
            const retryRes = await axios({
              method,
              url: `${BASE_URL}${url}`,
              data: body,
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });
            return retryRes.data;
          } catch (reissueError) {
            const err = new Error("토큰 재발급 실패");
            throw err;
          }

        case status >= 400 && status < 500:
          console.log("클라이언트 에러");
          break;

        case status >= 500:
          console.log("서버 에러");
          break;

        default:
          console.log("기타 에러");
      }

      throw error;
    } catch (reissueError) {
      throw reissueError;
    }
  }
};
