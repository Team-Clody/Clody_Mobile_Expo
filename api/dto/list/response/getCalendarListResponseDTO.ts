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
  /** 답장 열람 가능 시각(ISO 8601). UNREADY 카운트다운에 사용 */
  replyAvailableAt?: string;
}

export interface GetCalendarListResponseDTO {
  totalCloverCount: number;
  hasTodayDiary: boolean;
  diaries: DiaryItem[];
}
