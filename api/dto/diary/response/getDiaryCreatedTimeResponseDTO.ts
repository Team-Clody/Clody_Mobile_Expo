/** GET /api/v1/diary/time 성공 시 data */
export interface GetDiaryCreatedTimeResponseDTO {
  HH: number;
  mm: number;
  ss: number;
  date: string;
  isFirst: boolean;
  isFromAd: boolean;
}
