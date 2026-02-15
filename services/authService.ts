import { login as KakaoLogin, me } from "@react-native-kakao/user";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const kakaoLogin = async () => {
  const { accessToken, refreshToken } = await onKakaoLogin();
  const user = await me();
  console.log(user.email);
  return Promise.all([
    SecureStore.setItemAsync("accessToken", accessToken),
    SecureStore.setItemAsync("refreshToken", refreshToken),
  ]);
};
const AppleLogin = async () => {
  const { accessToken, refreshToken } = await onAppleLogin();

  return Promise.all([
    SecureStore.setItemAsync("accessToken", accessToken),
    SecureStore.setItemAsync("refreshToken", refreshToken),
  ]);
};
const onKakaoLogin = async (): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> => {
  //console.log(await getKeyHashAndroid());
  try {
    throw new Error("강제 에러 발생");
    const result = await KakaoLogin();
    const accessToken = result.accessToken;

    const res = await axios.post(
      "https://test.clodycorp.com/api/v1/auth/signin",
      {
        platform: "kakao",
        fcmToken: "FCM_TOKEN",
      },
      {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      },
    );

    return {
      accessToken: res.data.data.accessToken,
      refreshToken: res.data.data.refreshToken,
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
};
const onAppleLogin = async (): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> => {
  //console.log(await getKeyHashAndroid());
  try {
    // 구현중

    return {
      accessToken: "123",
      refreshToken: "123",
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
};
const isAccessTokenValid = async (accessToken: string): Promise<boolean> => {
  try {
    const res = await axios.get("https://test.clodycorp.com/api/v1/user/info", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return res.status === 200;
  } catch (e: any) {
    if (e.response?.status === 401) {
      return false;
    }

    // 네트워크 에러 등은 일단 false 처리
    return false;
  }
};
const reissueWithRefreshToken = async (
  refreshToken: string | null,
): Promise<boolean> => {
  if (!refreshToken) return false;

  try {
    const res = await axios.get(
      "https://test.clodycorp.com/api/v1/auth/reissue",
      {
        headers: {
          Authorization: "Bearer " + refreshToken,
        },
      },
    );

    const newAccessToken = res.data.data.accessToken;
    const newRefreshToken = res.data.data.refreshToken;

    await SecureStore.setItemAsync("accessToken", newAccessToken);
    await SecureStore.setItemAsync("refreshToken", newRefreshToken);

    return true;
  } catch (err) {
    console.error("reissue failed:", err);
    return false;
  }
};

export default {
  kakaoLogin,
  AppleLogin,
  onKakaoLogin,
  onAppleLogin,
  isAccessTokenValid,
  reissueWithRefreshToken,
};
