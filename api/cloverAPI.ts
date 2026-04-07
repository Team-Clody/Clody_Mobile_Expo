import { GetCloverInfoResponseDTO } from "./dto/clover/response/getCloverInfoResponseDTO";
import { createAPIRequest, HeaderType } from "@/shared/http";

export const CloverAPI = {
  getCloverInfo: async (
    headerType: HeaderType = HeaderType.ACCESS_TOKEN,
  ) => {
    const resp = await createAPIRequest<GetCloverInfoResponseDTO>(
      "get",
      "/api/v2/user/clover",
      headerType,
    );
    return resp.data.data;
  },
};
