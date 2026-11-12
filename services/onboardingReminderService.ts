import { MyPageAPI } from "@/api/myPageAPI";
import { HeaderType } from "@/shared/http";

export type OnboardingReminder =
  | { enabled: true; time: string }
  | { enabled: false };

/** Save only the reminder choice; retain reply and draft notification settings. */
export async function saveOnboardingReminder(choice: OnboardingReminder): Promise<void> {
  if (choice.enabled && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(choice.time)) {
    throw new Error("INVALID_REMINDER_TIME");
  }

  await MyPageAPI.postAlarmSet(
    choice.enabled
      ? { isDiaryAlarm: true, time: choice.time }
      : { isDiaryAlarm: false },
    HeaderType.TIME_ZONE,
  );
}
