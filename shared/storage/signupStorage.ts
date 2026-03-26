import AsyncStorage from '@react-native-async-storage/async-storage';

const SIGNUP_KEYS = {
  PLATFORM: '@Clody:signup:platform',
  EMAIL: '@Clody:signup:email',
  PLATFORM_TOKEN: '@Clody:signup:platformToken',
  NAME: '@Clody:signup:name',
  GENDER: '@Clody:signup:gender',
  BIRTH_DATE: '@Clody:signup:birthDate',
} as const;

export interface SignupData {
  platform: 'apple' | 'kakao' | 'google' | null;
  email: string;
  platformToken: string;
  name: string;
  gender: string | null;
  birthDate: string | null;
}

class SignupStorage {
  async setLoginInfo(
    platform: 'apple' | 'kakao' | 'google',
    email: string,
    platformToken: string,
  ): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(SIGNUP_KEYS.PLATFORM, platform),
      AsyncStorage.setItem(SIGNUP_KEYS.EMAIL, email),
      AsyncStorage.setItem(SIGNUP_KEYS.PLATFORM_TOKEN, platformToken),
    ]);
  }

  async setName(name: string): Promise<void> {
    await AsyncStorage.setItem(SIGNUP_KEYS.NAME, name);
  }

  async setBirthInfo(
    birthDate: string | null,
    gender: string | null,
  ): Promise<void> {
    if (birthDate) {
      await AsyncStorage.setItem(SIGNUP_KEYS.BIRTH_DATE, birthDate);
    } else {
      await AsyncStorage.removeItem(SIGNUP_KEYS.BIRTH_DATE);
    }

    if (gender) {
      await AsyncStorage.setItem(SIGNUP_KEYS.GENDER, gender);
    } else {
      await AsyncStorage.removeItem(SIGNUP_KEYS.GENDER);
    }
  }

  async setGender(gender: string | null): Promise<void> {
    if (gender) {
      await AsyncStorage.setItem(SIGNUP_KEYS.GENDER, gender);
    } else {
      await AsyncStorage.removeItem(SIGNUP_KEYS.GENDER);
    }
  }

  async getSignupData(): Promise<SignupData> {
    const [platform, email, platformToken, name, gender, birthDate] =
      await Promise.all([
        AsyncStorage.getItem(SIGNUP_KEYS.PLATFORM),
        AsyncStorage.getItem(SIGNUP_KEYS.EMAIL),
        AsyncStorage.getItem(SIGNUP_KEYS.PLATFORM_TOKEN),
        AsyncStorage.getItem(SIGNUP_KEYS.NAME),
        AsyncStorage.getItem(SIGNUP_KEYS.GENDER),
        AsyncStorage.getItem(SIGNUP_KEYS.BIRTH_DATE),
      ]);

    return {
      platform: platform as 'apple' | 'kakao' | 'google' | null,
      email: email || '',
      platformToken: platformToken || '',
      name: name || '',
      gender,
      birthDate,
    };
  }

  async clear(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(SIGNUP_KEYS.PLATFORM),
      AsyncStorage.removeItem(SIGNUP_KEYS.EMAIL),
      AsyncStorage.removeItem(SIGNUP_KEYS.PLATFORM_TOKEN),
      AsyncStorage.removeItem(SIGNUP_KEYS.NAME),
      AsyncStorage.removeItem(SIGNUP_KEYS.GENDER),
      AsyncStorage.removeItem(SIGNUP_KEYS.BIRTH_DATE),
    ]);
  }
}

export const signupStorage = new SignupStorage();
