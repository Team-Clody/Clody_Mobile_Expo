import { login, me } from "@react-native-kakao/user";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
function convertBirth(raw: string) {
  if (!raw) {
    return "";
  }
  const yy = Number(raw.slice(0, 2));
  const mm = raw.slice(2, 4);
  const dd = raw.slice(4, 6);

  const currentYear = new Date().getFullYear() % 100;

  const fullYear =
    yy <= currentYear ? `20${raw.slice(0, 2)}` : `19${raw.slice(0, 2)}`;

  return `${fullYear}-${mm}-${dd}`;
}

const AppleLogin = async () => {
  const { accessToken, refreshToken } = await onAppleLogin();

  return Promise.all([
    SecureStore.setItemAsync("accessToken", accessToken),
    SecureStore.setItemAsync("refreshToken", refreshToken),
  ]);
};

const kakaoLogin = async () => {
  try {
    const { accessToken } = await login();
    const user = await me();
    await AsyncStorage.setItem("email", user.email);
    await AsyncStorage.setItem("kakao_accessToken", accessToken);
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
    console;
    return true;
  } catch (err) {
    console.error("reissue failed:", err);
    return false;
  }
};
const kakaoSignUp = async (form) => {
  try {
    const { nickname, birthDate, gender } = form;
    const accessToken = await AsyncStorage.getItem("kakao_accessToken");
    const email = await AsyncStorage.getItem("email");
    let fcmToken = await getPushToken();
    const res = await axios.post(
      "https://test.clodycorp.com/api/v1/auth/signup",
      {
        platform: "kakao",
        fcmToken: fcmToken ? fcmToken : null,
        name: nickname,
        gender: gender,
        birthDate: convertBirth(birthDate),
        email: email,
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
async function getPushToken() {
  try {
    let fcmToken = (await Notifications.getDevicePushTokenAsync()).data;
    return fcmToken;
  } catch (e) {
    console.log(e);
    return null;
  }
}
export default {
  kakaoLogin,
  kakaoSignUp,
  AppleLogin,
  onAppleLogin,
  isAccessTokenValid,
  reissueWithRefreshToken,
  getPushToken,
};
