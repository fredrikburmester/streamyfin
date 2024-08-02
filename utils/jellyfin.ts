import { Api } from "@jellyfin/sdk";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import {
  getMediaInfoApi,
  getUserLibraryApi,
  getPlaystateApi,
} from "@jellyfin/sdk/lib/utils/api";
import { iosProfile } from "./device-profiles";

export const markAsNotPlayed = async ({
  api,
  itemId,
  userId,
}: {
  api?: Api | null;
  itemId?: string | null;
  userId?: string | null;
}) => {
  if (!itemId || !userId || !api) {
    return false;
  }

  try {
    const response = await api.axiosInstance.delete(
      `${api.basePath}/UserPlayedItems/${itemId}`,
      {
        params: {
          userId,
        },
        headers: {
          Authorization: `MediaBrowser DeviceId="${api.deviceInfo.id}", Token="${api.accessToken}"`,
        },
      }
    );

    if (response.status === 200) return true;
    return false;
  } catch (error) {
    const e = error as any;
    console.error("Failed to report playback progress", e.message, e.status);
    return [];
  }
};

export const markAsPlayed = async ({
  api,
  itemId,
  userId,
}: {
  api?: Api | null;
  itemId?: string | null;
  userId?: string | null;
}) => {
  if (!itemId || !userId || !api) {
    return false;
  }

  try {
    const response = await api.axiosInstance.post(
      `${api.basePath}/UserPlayedItems/${itemId}`,
      {
        userId,
        datePlayed: new Date().toISOString(),
      },
      {
        headers: {
          Authorization: `MediaBrowser DeviceId="${api.deviceInfo.id}", Token="${api.accessToken}"`,
        },
      }
    );

    if (response.status === 200) return true;
    return false;
  } catch (error) {
    const e = error as any;
    console.error("Failed to report playback progress:", {
      message: e.message,
      status: e.response?.status,
      statusText: e.response?.statusText,
      url: e.config?.url,
      method: e.config?.method,
      data: e.response?.data,
      headers: e.response?.headers,
    });

    if (e.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Server responded with error:", e.response.data);
    } else if (e.request) {
      // The request was made but no response was received
      console.error("No response received from server");
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error setting up the request:", e.message);
    }
    return [];
  }
};

export const nextUp = async ({
  itemId,
  userId,
  api,
}: {
  itemId?: string | null;
  userId?: string | null;
  api?: Api | null;
}) => {
  if (!itemId || !userId || !api) {
    return [];
  }

  try {
    const response = await api.axiosInstance.get(
      `${api.basePath}/Shows/NextUp`,
      {
        params: {
          SeriesId: itemId,
          UserId: userId,
          Fields: "MediaSourceCount",
        },
        headers: {
          Authorization: `MediaBrowser DeviceId="${api.deviceInfo.id}", Token="${api.accessToken}"`,
        },
      }
    );

    console.log(response.data);

    return response?.data.Items as BaseItemDto[];
  } catch (error) {
    const e = error as any;
    console.error("Failed to report playback progress", e.message, e.status);
    return [];
  }
};

export const reportPlaybackStopped = async ({
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
    await api.axiosInstance.delete(`${api.basePath}/PlayingItems/${itemId}`, {
      params: {
        playSessionId: sessionId,
        positionTicks: Math.round(positionTicks),
        mediaSourceId: itemId,
      },
      headers: {
        Authorization: `MediaBrowser DeviceId="${api.deviceInfo.id}", Token="${api.accessToken}"`,
      },
    });
  } catch (error) {
    console.error("Failed to report playback progress", error);
  }
};

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
  forceTranscoding = false,
}: {
  api: Api | null | undefined;
  item: BaseItemDto | null | undefined;
  userId: string | null | undefined;
  startTimeTicks: number;
  maxStreamingBitrate?: number;
  forceTranscoding?: boolean;
}) => {
  if (!api || !userId || !item?.Id) {
    return null;
  }

  const itemId = item.Id;
  let url: string = "";

  try {
    const response = await api.axiosInstance.post(
      `${api.basePath}/Items/${itemId}/PlaybackInfo`,
      {
        DeviceProfile: {
          ...iosProfile,
          MaxStaticBitrate: maxStreamingBitrate,
          MaxStreamingBitrate: maxStreamingBitrate,
        },
        UserId: userId,
        MaxStreamingBitrate: maxStreamingBitrate,
        StartTimeTicks: startTimeTicks,
        EnableTranscoding: forceTranscoding,
        AutoOpenLiveStream: true,
        MediaSourceId: itemId,
        AllowVideoStreamCopy: forceTranscoding ? false : true,
      },
      {
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
  quality: number = 50
) => {
  if (!api || !item) {
    console.warn("getBackdrop ~ Missing API or Item");
    return null;
  }

  if (item.BackdropImageTags && item.BackdropImageTags[0]) {
    return `${api.basePath}/Items/${item?.Id}/Images/Backdrop?quality=${quality}&fillWidth=500&tag=${item?.BackdropImageTags?.[0]}`;
  }

  if (item.ImageTags && item.ImageTags.Primary) {
    return `${api.basePath}/Items/${item?.Id}/Images/Primary?quality=${quality}&fillWidth=500&tag=${item.ImageTags.Primary}`;
  }

  if (item.ParentBackdropImageTags && item.ParentBackdropImageTags[0]) {
    return `${api.basePath}/Items/${item?.Id}/Images/Primary?quality=${quality}&fillWidth=500&tag=${item.ImageTags?.Primary}`;
  }

  return null;
};

/**
 * Retrieves the backdrop image URL for a given item.
 *
 * @param api - The Jellyfin API instance.
 * @param item - The media item to retrieve the backdrop image URL for.
 * @param quality - The desired image quality (default: 10).
 */
export const getBackdropById = (
  api: Api | null | undefined,
  itemId: string | null | undefined,
  quality: number = 10
) => {
  if (!api) {
    console.warn("getBackdrop ~ Missing API or Item");
    return null;
  }

  return `${api.basePath}/Items/${itemId}/Images/Backdrop?quality=${quality}`;
};

/**
 * Retrieves the primary image URL for a given item.
 *
 * @param api - The Jellyfin API instance.
 * @param item - The media item to retrieve the backdrop image URL for.
 * @param quality - The desired image quality (default: 10).
 */
export const getPrimaryImageById = (
  api: Api | null | undefined,
  itemId: string | null | undefined,
  quality: number = 10
) => {
  if (!api) {
    return null;
  }

  return `${api.basePath}/Items/${itemId}/Images/Primary?quality=${quality}`;
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

export const bitrateToString = (bitrate: number) => {
  const kbps = bitrate / 1000;
  const mbps = (bitrate / 1000000).toFixed(2);

  return `${mbps} Mb/s`;
};
