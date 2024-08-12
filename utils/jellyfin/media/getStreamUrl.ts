import ios12 from "@/utils/profiles/ios12";
import { Api } from "@jellyfin/sdk";
import {
  BaseItemDto,
  PlaybackInfoResponse,
  MediaSourceInfo,
} from "@jellyfin/sdk/lib/generated-client/models";

export const getStreamUrl = async ({
  api,
  item,
  userId,
  startTimeTicks = 0,
  maxStreamingBitrate,
  sessionData,
  deviceProfile = ios12,
  audioStreamIndex = 0,
  subtitleStreamIndex = 0,
}: {
  api: Api | null | undefined;
  item: BaseItemDto | null | undefined;
  userId: string | null | undefined;
  startTimeTicks: number;
  maxStreamingBitrate?: number;
  sessionData: PlaybackInfoResponse;
  deviceProfile: any;
  audioStreamIndex?: number;
  subtitleStreamIndex?: number;
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
      AudioStreamIndex: audioStreamIndex,
      SubtitleStreamIndex: subtitleStreamIndex,
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
