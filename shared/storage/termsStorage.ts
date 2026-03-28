import AsyncStorage from '@react-native-async-storage/async-storage';

const TERMS_KEYS = {
  ALL_AGREED: '@Clody:terms:allAgreed',
} as const;

class TermsStorage {
  async setAllAgreed(): Promise<void> {
    await AsyncStorage.setItem(TERMS_KEYS.ALL_AGREED, 'true');
  }

  async hasLocalAgreement(): Promise<boolean> {
    const agreed = await AsyncStorage.getItem(TERMS_KEYS.ALL_AGREED);
    return agreed === 'true';
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(TERMS_KEYS.ALL_AGREED);
  }
}

export const termsStorage = new TermsStorage();
