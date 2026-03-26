import { Platform } from 'react-native';

export const isIOS = (): boolean => {
  return Platform.OS === 'ios';
};

export const isAndroid = (): boolean => {
  return Platform.OS === 'android';
};

export const getPlatform = (): typeof Platform.OS => {
  return Platform.OS;
};
