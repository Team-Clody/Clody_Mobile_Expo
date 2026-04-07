import { GetUserInventoryListResponseDTO } from "./dto/inventory/response/getUserInventoryListResponseDTO";
import { createAPIRequest, HeaderType } from "@/shared/http";

export const InventoryAPI = {
  getUserInventories: async (
    headerType: HeaderType = HeaderType.ACCESS_TOKEN,
  ) => {
    const resp = await createAPIRequest<GetUserInventoryListResponseDTO>(
      "get",
      "/api/v2/user/inventories",
      headerType,
    );
    return resp.data.data;
  },
};
