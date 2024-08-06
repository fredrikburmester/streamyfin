import { Api } from "@jellyfin/sdk";
import { getImageApi } from "@jellyfin/sdk/lib/utils/api";

export const getPrimaryImage = async (
  api: Api,
  itemId: string,
): Promise<string> => {
  const image = await getImageApi(api).getItemImage({
    itemId,
    imageType: "Primary",
    quality: 90,
    width: 1000,
  });

  console.log("getPrimaryImage ~", image.data);

  return image.data;
};
