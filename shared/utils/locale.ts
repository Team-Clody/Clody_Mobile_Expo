import * as Localization from 'expo-localization';

export const getDeviceLocale = (): string => {
  const locales = Localization.getLocales();
  if (locales.length === 0) {
    return 'en-US';
  }

  const locale = locales[0];
  return `${locale.languageCode}-${locale.regionCode ?? 'US'}`;
};

export const getLanguageCode = (): string => {
  const locales = Localization.getLocales();
  if (locales.length === 0) {
    return 'en';
  }

  return (locales[0].languageCode ?? 'en').toLowerCase();
};

export const isKoreanLocale = (): boolean => {
  const locales = Localization.getLocales();
  if (locales.length === 0) {
    return false;
  }

  const languageCode = (locales[0].languageCode ?? '').toLowerCase();
  return languageCode === 'ko';
};

export type Region = 'domestic' | 'international';

export const getRegion = (): Region => {
  return isKoreanLocale() ? 'domestic' : 'international';
};
