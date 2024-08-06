import { Api } from "@jellyfin/sdk";
import {
  getMediaInfoApi,
  getUserLibraryApi,
} from "@jellyfin/sdk/lib/utils/api";

/**
 *  Fetches the media info for a given item.
 *
 * @param {Api} api - The Jellyfin API instance.
 * @param  {string} itemId - The ID of the media to fetch info for.
 * @param {string} userId - The ID of the user to fetch info for.
 *
 * @returns {Promise<BaseItemDto>} - The media info.
 */
export const getUserItemData = async ({
  api,
  itemId,
  userId,
}: {
  api: Api | null | undefined;
  itemId: string | null | undefined;
  userId: string | null | undefined;
}) => {
  if (!api || !itemId || !userId) {
    return null;
  }
  return (await getUserLibraryApi(api).getItem({ itemId, userId })).data;
};

export const getPlaybackInfo = async (
  api?: Api | null | undefined,
  itemId?: string | null | undefined,
  userId?: string | null | undefined,
) => {
  if (!api || !itemId || !userId) {
    return null;
  }

  const a = await getMediaInfoApi(api).getPlaybackInfo({
    itemId,
    userId,
  });

  return a.data;
};
