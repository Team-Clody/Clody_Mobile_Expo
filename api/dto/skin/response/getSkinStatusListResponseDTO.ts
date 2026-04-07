export type SkinStatus = "RECEIVED" | "UNLOCKED" | "LOCKED";

export interface SkinStatusItemResponseDTO {
  skinId: number;
  url: string;
  cloverStage: string;
  status: SkinStatus;
}

export interface GetSkinStatusListResponseDTO {
  totalCloverCount: number;
  currentStage: number;
  currentStageMaxClover: number;
  skins: SkinStatusItemResponseDTO[];
}
