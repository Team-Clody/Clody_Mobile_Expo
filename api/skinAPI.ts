import { GetSkinStatusListResponseDTO } from "./dto/skin/response/getSkinStatusListResponseDTO";
import { PostSkinAcquireResponseDTO } from "./dto/skin/response/postSkinAcquireResponseDTO";
import { GetEquippedSkinResponseDTO } from "./dto/skin/response/getEquippedSkinResponseDTO";
import { createAPIRequest, HeaderType } from "@/shared/http";

export const SkinAPI = {
  getSkinStatusList: async (
    headerType: HeaderType = HeaderType.ACCESS_TOKEN,
  ) => {
    const resp = await createAPIRequest<GetSkinStatusListResponseDTO>(
      "get",
      "/api/v2/user/skins",
      headerType,
    );
    return resp.data.data;
  },
  acquireSkin: async (
    skinId: number,
    headerType: HeaderType = HeaderType.ACCESS_TOKEN,
  ) => {
    const resp = await createAPIRequest<PostSkinAcquireResponseDTO>(
      "post",
      `/api/v2/user/skin/${skinId}/acquire`,
      headerType,
    );
    return resp.data.data;
  },
  equipSkin: async (
    inventoryId: number,
    headerType: HeaderType = HeaderType.ACCESS_TOKEN,
  ) => {
    const resp = await createAPIRequest<void>(
      "patch",
      `/api/v2/user/skin/${inventoryId}/equip`,
      headerType,
    );
    return resp.data.data;
  },
  getEquippedSkin: async (
    headerType: HeaderType = HeaderType.ACCESS_TOKEN,
  ) => {
    const resp = await createAPIRequest<GetEquippedSkinResponseDTO>(
      "get",
      "/api/v2/user/skin/equipped",
      headerType,
    );
    return resp.data.data;
  },
};
