import { getRegion } from './locale';
import { isIOS, isAndroid } from './platform';

export type LoginButtonType = 'apple' | 'google' | 'kakao';

export const getAvailableLoginButtons = (): LoginButtonType[] => {
  const region = getRegion();
  const platform = isIOS() ? 'ios' : isAndroid() ? 'android' : null;

  if (!platform) {
    return [];
  }

  if (platform === 'ios' && region === 'domestic') {
    return ['apple', 'kakao'];
  }

  if (platform === 'ios' && region === 'international') {
    return ['apple', 'kakao'];
  }

  if (platform === 'android' && region === 'domestic') {
    return ['google', 'kakao'];
  }

  if (platform === 'android' && region === 'international') {
    return ['google', 'kakao'];
  }

  return [];
};
