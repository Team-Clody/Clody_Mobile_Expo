export type ReplyStatus =
  | 'UNREADY'
  | 'READY_NOT_READ'
  | 'READY_READ'
  | 'HAS_DRAFT'
  | 'INVALID_DRAFT';

export interface DiaryContent {
  content: string;
}

export interface DiaryItem {
  diaryCount: number;
  replyStatus: ReplyStatus;
  date: string;
  diary: DiaryContent[];
  isDeleted: boolean;
}

export interface GetCalendarListResponseDTO {
  totalCloverCount: number;
  hasTodayDiary: boolean;
  diaries: DiaryItem[];
}
