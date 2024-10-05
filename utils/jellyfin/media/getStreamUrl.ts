import ios from "@/utils/profiles/ios";
import { Api } from "@jellyfin/sdk";
import {
  BaseItemDto,
  MediaSourceInfo,
  PlaybackInfoResponse,
} from "@jellyfin/sdk/lib/generated-client/models";
import { getAuthHeaders } from "../jellyfin";
import iosFmp4 from "@/utils/profiles/iosFmp4";
import { getItemsApi, getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";

export const getStreamUrl = async ({
  api,
  item,
  userId,
  startTimeTicks = 0,
  maxStreamingBitrate,
  sessionData,
  deviceProfile = iosFmp4,
  audioStreamIndex = 0,
  subtitleStreamIndex = undefined,
  forceDirectPlay = false,
  mediaSourceId,
}: {
  api: Api | null | undefined;
  item: BaseItemDto | null | undefined;
  userId: string | null | undefined;
  startTimeTicks: number;
  maxStreamingBitrate?: number;
  sessionData?: PlaybackInfoResponse | null;
  deviceProfile: any;
  audioStreamIndex?: number;
  subtitleStreamIndex?: number;
  forceDirectPlay?: boolean;
  height?: number;
  mediaSourceId?: string | null;
}) => {
  if (!api || !userId || !item?.Id) {
    return null;
  }

  console.log("[0] getStreamUrl ~");

  const itemId = item.Id;

  console.log("[1] getStreamUrl ~");
  const res1 = await api.axiosInstance.post(
    `${api.basePath}/Items/${itemId}/PlaybackInfo`,
    {
      UserId: itemId,
      StartTimeTicks: 0,
      IsPlayback: true,
      AutoOpenLiveStream: true,
      MaxStreamingBitrate: 140000000,
    },
    {
      headers: getAuthHeaders(api),
    }
  );

  console.log("[2] getStreamUrl ~", res1.status, res1.statusText);

  const res2 = await api.axiosInstance.post(
    `${api.basePath}/Items/${itemId}/PlaybackInfo`,
    {
      DeviceProfile: deviceProfile,
      UserId: userId,
      MaxStreamingBitrate: maxStreamingBitrate,
      StartTimeTicks: startTimeTicks,
      EnableTranscoding: maxStreamingBitrate ? true : undefined,
      AutoOpenLiveStream: true,
      MediaSourceId: mediaSourceId,
      AllowVideoStreamCopy: maxStreamingBitrate ? false : true,
      AudioStreamIndex: audioStreamIndex,
      SubtitleStreamIndex: subtitleStreamIndex,
      DeInterlace: true,
      BreakOnNonKeyFrames: false,
      CopyTimestamps: false,
      EnableMpegtsM2TsMode: false,
    },
    {
      headers: getAuthHeaders(api),
    }
  );

  console.log("[3] getStreamUrl ~");

  console.log(
    `${api.basePath}/Items/${itemId}/PlaybackInfo`,
    res2.status,
    res2.statusText
  );

  const mediaSource: MediaSourceInfo = res2.data.MediaSources.find(
    (source: MediaSourceInfo) => source.Id === mediaSourceId
  );

  let url: string | null | undefined;

  if (mediaSource.SupportsDirectPlay || forceDirectPlay === true) {
    if (item.MediaType === "Video") {
      url = `${api.basePath}/Videos/${itemId}/stream.mp4?playSessionId=${sessionData?.PlaySessionId}&mediaSourceId=${mediaSource.Id}&static=true&subtitleStreamIndex=${subtitleStreamIndex}&audioStreamIndex=${audioStreamIndex}&deviceId=${api.deviceInfo.id}&api_key=${api.accessToken}`;
    } else if (item.MediaType === "Audio") {
      const searchParams = new URLSearchParams({
        UserId: userId,
        DeviceId: api.deviceInfo.id,
        MaxStreamingBitrate: "140000000",
        Container:
          "opus,webm|opus,mp3,aac,m4a|aac,m4b|aac,flac,webma,webm|webma,wav,ogg",
        TranscodingContainer: "mp4",
        TranscodingProtocol: "hls",
        AudioCodec: "aac",
        api_key: api.accessToken,
        PlaySessionId: sessionData?.PlaySessionId || "",
        StartTimeTicks: "0",
        EnableRedirection: "true",
        EnableRemoteMedia: "false",
      });
      url = `${
        api.basePath
      }/Audio/${itemId}/universal?${searchParams.toString()}`;
    }
  } else if (mediaSource.TranscodingUrl) {
    url = `${api.basePath}${mediaSource.TranscodingUrl}`;
  }

  if (!url) throw new Error("No url");

  console.log(
    mediaSource.VideoType,
    mediaSource.Container,
    mediaSource.TranscodingContainer,
    mediaSource.TranscodingSubProtocol
  );

  return url;
};
