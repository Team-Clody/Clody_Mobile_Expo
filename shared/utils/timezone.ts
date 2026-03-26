import * as Localization from 'expo-localization';

export const getDeviceTimeZone = (): string => {
  const calendars = Localization.getCalendars();
  if (calendars.length === 0 || !calendars[0].timeZone) {
    return 'UTC';
  }
  return calendars[0].timeZone;
};

export const isKoreanTimeZone = (): boolean => {
  const timeZone = getDeviceTimeZone();
  return timeZone === 'Asia/Seoul';
};
