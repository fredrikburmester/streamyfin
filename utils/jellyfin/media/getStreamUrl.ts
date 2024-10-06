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
import { isPlainObject } from "lodash";
import { Alert } from "react-native";

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

  let mediaSource: MediaSourceInfo | undefined;
  let url: string | null | undefined;

  if (item.Type === "Program") {
    const res0 = await getMediaInfoApi(api).getPlaybackInfo(
      {
        userId,
        itemId: item.ChannelId!,
      },
      {
        method: "POST",
        params: {
          startTimeTicks: 0,
          isPlayback: true,
          autoOpenLiveStream: true,
          maxStreamingBitrate,
          audioStreamIndex,
        },
        data: {
          deviceProfile,
        },
      }
    );

    const mediaSourceId = res0.data.MediaSources?.[0].Id;
    const liveStreamId = res0.data.MediaSources?.[0].LiveStreamId;

    const transcodeUrl = res0.data.MediaSources?.[0].TranscodingUrl;

    console.log("transcodeUrl", transcodeUrl);

    if (transcodeUrl) return `${api.basePath}${transcodeUrl}`;
  }

  const itemId = item.Id;

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

  mediaSource = res2.data.MediaSources.find(
    (source: MediaSourceInfo) => source.Id === mediaSourceId
  );

  if (mediaSource?.SupportsDirectPlay || forceDirectPlay === true) {
    if (item.MediaType === "Video") {
      url = `${api.basePath}/Videos/${itemId}/stream.mp4?playSessionId=${sessionData?.PlaySessionId}&mediaSourceId=${mediaSource?.Id}&static=true&subtitleStreamIndex=${subtitleStreamIndex}&audioStreamIndex=${audioStreamIndex}&deviceId=${api.deviceInfo.id}&api_key=${api.accessToken}`;
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
  } else if (mediaSource?.TranscodingUrl) {
    url = `${api.basePath}${mediaSource.TranscodingUrl}`;
  }

  if (!url) throw new Error("No url");

  return url;
};
