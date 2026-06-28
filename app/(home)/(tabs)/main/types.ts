export type ReplyStatus =
  | "UNREADY"
  | "READY_NOT_READ"
  | "READY_READ"
  | "HAS_DRAFT"
  | "INVALID_DRAFT";

export type CalendarDiary = {
  diaryCount: number;
  replyStatus?: ReplyStatus;
  date: string;
  diary?: Array<{ content: string }>;
  isDeleted?: boolean;
  replyAvailableAt?: string;
};
