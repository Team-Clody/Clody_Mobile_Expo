import { getLanguageCode } from './locale';
import { isIOS, isAndroid } from './platform';

export type LoginButtonType = 'apple' | 'google' | 'kakao';

export const getAvailableLoginButtons = (): LoginButtonType[] => {
  if (!isIOS() && !isAndroid()) return [];
  // The app supports Korean and falls back to its English screens otherwise.
  const language = getLanguageCode() === 'ko' ? 'ko' : 'en';
  const buttons: LoginButtonType[] = [];
  if (language === 'ko') buttons.push('kakao');
  if (isIOS()) buttons.push('apple');
  if (language === 'en') buttons.push('google');
  return buttons;
};
