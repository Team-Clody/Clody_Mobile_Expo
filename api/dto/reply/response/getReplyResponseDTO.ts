export interface GetReplyResponseDTO {
  nickname: string;
  /** 답장 생성 중에는 실제 서버가 null을 반환한다. */
  content: string | null;
  month: number;
  date: number;
  isRead: boolean;
  isFromAd: boolean;
}
