import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getRegion } from '@/shared/utils/locale';
import {
  getAvailableLoginButtons,
  LoginButtonType,
} from '@/shared/utils/loginButtons';
import { getDeviceLocale, getLanguageCode } from '@/shared/utils/locale';
import { getPlatform } from '@/shared/utils/platform';
import { getDeviceTimeZone } from '@/shared/utils/timezone';

export interface DeviceContextValue {
  region: 'domestic' | 'international';
  platform: typeof Platform.OS;
  locale: string;
  languageCode: string;
  availableLoginButtons: LoginButtonType[];
  isKorean: boolean;
  timeZone: string;
  isKoreanLanguage: boolean;
  appVersion: string;
}

const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

interface DeviceProviderProps {
  children: ReactNode;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const contextValue = useMemo<DeviceContextValue>(() => {
    const region = getRegion();
    const platform = getPlatform();
    const locale = getDeviceLocale();
    const languageCode = getLanguageCode();
    const availableLoginButtons = getAvailableLoginButtons();
    const isKorean = region === 'domestic';
    const isKoreanLanguage = languageCode === 'ko';
    const timeZone = getDeviceTimeZone();
    const appVersion = Constants.expoConfig?.version ?? '0.0.0';

    return {
      region,
      platform,
      locale,
      languageCode,
      availableLoginButtons,
      isKorean,
      isKoreanLanguage,
      timeZone,
      appVersion,
    };
  }, []);

  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = (): DeviceContextValue => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};
