export interface PostAlarmRequestDTO {
  isDiaryAlarm?: boolean | null;
  isReplyAlarm?: boolean | null;
  isDraftAlarm?: boolean | null;
  fcmToken?: string | null;
  time?: string | null;
}
