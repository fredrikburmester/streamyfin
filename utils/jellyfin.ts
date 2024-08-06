import { Api } from "@jellyfin/sdk";
import {
  BaseItemDto,
  BaseItemPerson,
  MediaSourceInfo,
  PlaybackInfoResponse,
} from "@jellyfin/sdk/lib/generated-client/models";
import {
  getMediaInfoApi,
  getUserLibraryApi,
} from "@jellyfin/sdk/lib/utils/api";
import ios12 from "./profiles/ios12";

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
  userId: string,
): Promise<string> => {
  const playbackData = await getMediaInfoApi(api).getPlaybackInfo({
    itemId,
    userId,
  });

  const mediaSources = playbackData.data?.MediaSources;
  if (!mediaSources || mediaSources.length === 0) {
    throw new Error(
      "No media sources available for the requested item and user.",
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
  itemId?: string | null | undefined,
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

export const getStreamUrl = async ({
  api,
  item,
  userId,
  startTimeTicks = 0,
  maxStreamingBitrate,
  sessionData,
  deviceProfile = ios12,
}: {
  api: Api | null | undefined;
  item: BaseItemDto | null | undefined;
  userId: string | null | undefined;
  startTimeTicks: number;
  maxStreamingBitrate?: number;
  sessionData: PlaybackInfoResponse;
  deviceProfile: any;
}) => {
  if (!api || !userId || !item?.Id) {
    return null;
  }

  const itemId = item.Id;

  const response = await api.axiosInstance.post(
    `${api.basePath}/Items/${itemId}/PlaybackInfo`,
    {
      DeviceProfile: deviceProfile,
      UserId: userId,
      MaxStreamingBitrate: maxStreamingBitrate,
      StartTimeTicks: startTimeTicks,
      EnableTranscoding: maxStreamingBitrate ? true : undefined,
      AutoOpenLiveStream: true,
      MediaSourceId: itemId,
      AllowVideoStreamCopy: maxStreamingBitrate ? false : true,
    },
    {
      headers: {
        Authorization: `MediaBrowser DeviceId="${api.deviceInfo.id}", Token="${api.accessToken}"`,
      },
    },
  );

  const mediaSource = response.data.MediaSources?.[0] as MediaSourceInfo;

  if (!mediaSource) {
    throw new Error("No media source");
  }
  if (!sessionData.PlaySessionId) {
    throw new Error("no PlaySessionId");
  }

  if (mediaSource.SupportsDirectPlay) {
    console.log("Using direct stream!");
    return `${api.basePath}/Videos/${itemId}/stream.mp4?playSessionId=${sessionData.PlaySessionId}&mediaSourceId=${itemId}&static=true`;
  }

  console.log("Using transcoded stream!");
  return `${api.basePath}${mediaSource.TranscodingUrl}`;
};

/**
 * Retrieves the primary image URL for a given item.
 *
 * @param api - The Jellyfin API instance.
 * @param item - The media item to retrieve the backdrop image URL for.
 * @param quality - The desired image quality (default: 90).
 */
export const getPrimaryImage = ({
  api,
  item,
  quality = 90,
  width = 500,
}: {
  api?: Api | null;
  item?: BaseItemDto | BaseItemPerson | null;
  quality?: number | null;
  width?: number | null;
}) => {
  if (!item || !api) {
    return null;
  }

  if (!isBaseItemDto(item)) {
    return `${api?.basePath}/Items/${item?.Id}/Images/Primary`;
  }

  const backdropTag = item.BackdropImageTags?.[0];
  const primaryTag = item.ImageTags?.["Primary"];

  const params = new URLSearchParams({
    fillWidth: width ? String(width) : "500",
    quality: quality ? String(quality) : "90",
  });

  if (primaryTag) {
    params.set("tag", primaryTag);
  } else if (backdropTag) {
    params.set("tag", backdropTag);
  }

  return `${api?.basePath}/Items/${
    item.Id
  }/Images/Primary?${params.toString()}`;
};

/**
 * Retrieves the primary image URL for a given item.
 *
 * @param api - The Jellyfin API instance.
 * @param item - The media item to retrieve the backdrop image URL for.
 * @param quality - The desired image quality (default: 90).
 */
export const getPrimaryImageById = ({
  api,
  id,
  quality = 90,
  width = 500,
}: {
  api?: Api | null;
  id?: string | null;
  quality?: number | null;
  width?: number | null;
}) => {
  if (!id) {
    return null;
  }

  const params = new URLSearchParams({
    fillWidth: width ? String(width) : "500",
    quality: quality ? String(quality) : "90",
  });

  return `${api?.basePath}/Items/${id}/Images/Primary?${params.toString()}`;
};

function isBaseItemDto(item: any): item is BaseItemDto {
  return item && "BackdropImageTags" in item && "ImageTags" in item;
}

/**
 * Retrieves the primary image URL for a given item.
 *
 * @param api - The Jellyfin API instance.
 * @param item - The media item to retrieve the backdrop image URL for.
 * @param quality - The desired image quality (default: 10).
 */
export const getLogoImageById = ({
  api,
  item,
}: {
  api?: Api | null;
  item?: BaseItemDto | null;
}) => {
  if (!api || !item) {
    return null;
  }

  const imageTags = item.ImageTags?.["Logo"];

  if (!imageTags) return null;

  const params = new URLSearchParams();

  params.append("tag", imageTags);
  params.append("quality", "90");
  params.append("fillHeight", "130");

  return `${api.basePath}/Items/${item.Id}/Images/Logo?${params.toString()}`;
};

/**
 * Retrieves the primary image URL for a given item.
 *
 * @param api - The Jellyfin API instance.
 * @param item - The media item to retrieve the backdrop image URL for.
 * @param quality - The desired image quality (default: 10).
 */
export const getBackdrop = ({
  api,
  item,
  quality,
  width,
}: {
  api?: Api | null;
  item?: BaseItemDto | null;
  quality?: number;
  width?: number;
}) => {
  if (!api || !item) {
    return null;
  }

  const backdropImageTags = item.BackdropImageTags?.[0];

  const params = new URLSearchParams();

  if (quality) {
    params.append("quality", quality.toString());
  }

  if (width) {
    params.append("fillWidth", width.toString());
  }

  if (backdropImageTags) {
    params.append("tag", backdropImageTags);
    return `${api.basePath}/Items/${
      item.Id
    }/Images/Backdrop/0?${params.toString()}`;
  } else {
    return getPrimaryImage({ api, item, quality, width });
  }
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
    `${serverUrl}/Videos/${itemId}/stream.mp4?${streamParams.toString()}`,
  );
}

export const bitrateToString = (bitrate: number) => {
  const kbps = bitrate / 1000;
  const mbps = (bitrate / 1000000).toFixed(2);

  return `${mbps} Mb/s`;
};
