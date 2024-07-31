import { Api } from "@jellyfin/sdk";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import {
  getMediaInfoApi,
  getUserLibraryApi,
  getPlaystateApi,
} from "@jellyfin/sdk/lib/utils/api";
import { iosProfile } from "./device-profiles";

export const reportPlaybackProgress = async ({
  api,
  sessionId,
  itemId,
  positionTicks,
}: {
  api: Api | null | undefined;
  sessionId: string | null | undefined;
  itemId: string | null | undefined;
  positionTicks: number | null | undefined;
}) => {
  if (!api || !sessionId || !itemId || !positionTicks) {
    console.log("Missing required parameters", {
      api,
      sessionId,
      itemId,
      positionTicks,
    });
    return;
  }

  try {
    const response = await api.axiosInstance.post(
      `${api.basePath}/Sessions/Playing/Progress`,
      {
        ItemId: itemId,
        PlaySessionId: sessionId,
        IsPaused: false,
        PositionTicks: Math.round(positionTicks),
        CanSeek: true,
        MediaSourceId: itemId,
      },
      {
        headers: {
          Authorization: `MediaBrowser DeviceId="${api.deviceInfo.id}", Token="${api.accessToken}"`,
        },
      }
    );
  } catch (error) {
    console.error("Failed to report playback progress", error);
    if (error.response) {
      console.error("Error data:", error.response.data);
      console.error("Error status:", error.response.status);
      console.error("Error headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
  }
};

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
  userId?: string | null | undefined
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

/**
 * Retrieves the playback URL for the given item ID and user ID.
 *
 * @param api - The Jellyfin API instance.
 * @param itemId - The ID of the media item to retrieve playback URL for.
 * @param userId - The ID of the user requesting the playback URL.
 * @returns The playback URL as a string.
 */
export const getPlaybackUrl = async (
  api: Api,
  itemId: string,
  userId: string
): Promise<string> => {
  const playbackData = await getMediaInfoApi(api).getPlaybackInfo({
    itemId,
    userId,
  });

  const mediaSources = playbackData.data?.MediaSources;
  if (!mediaSources || mediaSources.length === 0) {
    throw new Error(
      "No media sources available for the requested item and user."
    );
  }

  const mediaSource = mediaSources[0];
  const transcodeUrl = mediaSource.TranscodingUrl;
  if (transcodeUrl) {
    return transcodeUrl;
  }

  // Construct a fallback URL if the TranscodingUrl is not available
  const { Id, ETag } = mediaSource;
  if (!Id) {
    throw new Error("Media source ID is missing.");
  }

  const queryParams = new URLSearchParams({
    videoBitRate: "4000",
    videoCodec: "h264",
    audioCodec: "aac",
    container: "mp4",
    SegmentContainer: "mp4",
    deviceId: api.deviceInfo?.id || "",
    api_key: api.accessToken || "",
    Tag: ETag || "",
    MediaSourceId: Id || "",
  });

  return `/Videos/${Id}/stream?${queryParams}`;
};

/**
 * Retrieves an item by its ID from the API.
 *
 * @param api - The Jellyfin API instance.
 * @param itemId - The ID of the item to retrieve.
 * @returns The item object or undefined if no item matches the ID.
 */
export const getItemById = async (
  api?: Api | null | undefined,
  itemId?: string | null | undefined
): Promise<BaseItemDto | undefined> => {
  if (!api || !itemId) {
    return undefined;
  }

  try {
    const itemData = await getUserLibraryApi(api).getItem({ itemId });

    const item = itemData.data;
    if (!item) {
      console.error("No items found with the specified ID:", itemId);
      return undefined;
    }

    return item;
  } catch (error) {
    console.error("Failed to retrieve the item:", error);
    throw new Error(`Failed to retrieve the item due to an error: ${error}`);
  }
};

/**
 * Retrieves a stream URL for the given item ID and user ID.
 *
 * @param api - The Jellyfin API instance.
 * @param itemId - The ID of the media item to retrieve the stream URL for.
 * @param userId - The ID of the user requesting the stream URL.
 */
export const getStreamUrl = async ({
  api,
  item,
  userId,
  startTimeTicks = 0,
  maxStreamingBitrate = 140000000,
}: {
  api: Api | null | undefined;
  item: BaseItemDto | null | undefined;
  userId: string | null | undefined;
  startTimeTicks: number;
  maxStreamingBitrate?: number;
}) => {
  if (!api || !userId || !item?.Id) {
    return null;
  }

  const itemId = item.Id;
  let url: string = "";

  console.info(
    `Retrieving stream URL for item ID: ${item.Id} with start position: ${startTimeTicks}.`
  );

  try {
    const response = await api.axiosInstance.post(
      `${api.basePath}/Items/${itemId}/PlaybackInfo`,
      {
        DeviceProfile: iosProfile,
      },
      {
        params: {
          itemId,
          userId,
          startTimeTicks,
          maxStreamingBitrate,
          mediaSourceId: itemId,
          enableTranscoding: true,
          autoOpenLiveStream: true,
        },
        headers: {
          Authorization: `MediaBrowser DeviceId="${api.deviceInfo.id}", Token="${api.accessToken}"`,
        },
      }
    );

    const data = response.data;

    if (item.MediaSources?.[0].SupportsDirectPlay) {
      console.log("Direct play supported");
    }

    if (
      item.MediaSources?.[0].SupportsTranscoding &&
      data.MediaSources?.[0].TranscodingUrl
    ) {
      console.log("Supports transcoding");
    }

    if (
      item.MediaSources?.[0].SupportsTranscoding &&
      !data.MediaSources?.[0].TranscodingUrl
    ) {
      console.log("Supports transcoding, but no URL found");
    }

    if (data.MediaSources?.[0].TranscodingUrl) {
      url = api.basePath + data.MediaSources?.[0].TranscodingUrl;
    } else {
      url = buildStreamUrl({
        apiKey: api.accessToken || "",
        sessionId: "",
        itemId: itemId,
        serverUrl: api.basePath || "",
        deviceId: "unique-device-id",
        mediaSourceId: data.MediaSources?.[0].Id || "",
        tag: data.MediaSources?.[0]?.ETag || "",
      }).toString();
    }
  } catch (e) {
    console.error(e);
  }

  return url;
};

/**
 * Retrieves the backdrop image URL for a given item.
 *
 * @param api - The Jellyfin API instance.
 * @param item - The media item to retrieve the backdrop image URL for.
 * @param quality - The desired image quality (default: 10).
 */
export const getBackdrop = (
  api: Api | null | undefined,
  item: BaseItemDto | null | undefined,
  quality: number = 10
) => {
  if (!api || !item) {
    console.warn("getBackdrop ~ Missing API or Item");
    return null;
  }

  if (item.BackdropImageTags && item.BackdropImageTags[0]) {
    return `${api.basePath}/Items/${item?.Id}/Images/Backdrop?quality=${quality}&tag=${item?.BackdropImageTags?.[0]}`;
  }

  if (item.ImageTags && item.ImageTags.Primary) {
    return `${api.basePath}/Items/${item?.Id}/Images/Primary?quality=${quality}&tag=${item.ImageTags.Primary}`;
  }

  if (item.ParentBackdropImageTags && item.ParentBackdropImageTags[0]) {
    return `${api.basePath}/Items/${item?.Id}/Images/Primary?quality=${quality}&tag=${item.ImageTags?.Primary}`;
  }

  return null;
};

/**
 * Builds a stream URL for the given item ID, user ID, and other parameters.
 *
 * @param {object} options - Options to build the stream URL.
 * @param {string} options.deviceId - The device ID of the requesting client.
 * @param {string} options.apiKey - The API key used for authentication.
 * @param {string} options.sessionId - The session ID of the user requesting the stream.
 * @param {string} options.itemId - The ID of the media item to retrieve the stream URL for.
 * @param {string} options.serverUrl - The base URL of the Jellyfin server.
 * @param {string} options.mediaSourceId - The ID of the media source requested.
 * @param {string} options.tag - The ETag tag of the media source.
 *
 * @returns {URL} A URL that can be used to stream the media item.
 */
function buildStreamUrl({
  deviceId,
  apiKey,
  sessionId,
  itemId,
  serverUrl,
  mediaSourceId,
  tag,
}: {
  deviceId: string;
  apiKey: string;
  sessionId: string;
  itemId: string;
  serverUrl: string;
  mediaSourceId: string;
  tag: string;
}): URL {
  const streamParams = new URLSearchParams({
    Static: "true",
    deviceId,
    api_key: apiKey,
    playSessionId: sessionId,
    videoCodec: "h264",
    audioCodec: "aac,mp3,ac3,eac3,flac,alac",
    maxAudioChannels: "6",
    mediaSourceId,
    Tag: tag,
  });
  return new URL(
    `${serverUrl}/Videos/${itemId}/stream.mp4?${streamParams.toString()}`
  );
}
