import iosFmp4 from "@/utils/profiles/iosFmp4";
import { Api } from "@jellyfin/sdk";
import {
  BaseItemDto,
  MediaSourceInfo,
  PlaybackInfoResponse,
} from "@jellyfin/sdk/lib/generated-client/models";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";
import { getAuthHeaders } from "../jellyfin";

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
}): Promise<{
  url: string | null;
  sessionId: string | null;
} | null> => {
  if (!api || !userId || !item?.Id) {
    return null;
  }

  let mediaSource: MediaSourceInfo | undefined;
  let url: string | null | undefined;
  let sessionId: string | null | undefined;

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
    const transcodeUrl = res0.data.MediaSources?.[0].TranscodingUrl;
    sessionId = res0.data.PlaySessionId || null;

    if (transcodeUrl) {
      return { url: `${api.basePath}${transcodeUrl}`, sessionId };
    }
  }

  const itemId = item.Id;

  const res2 = await getMediaInfoApi(api).getPlaybackInfo(
    {
      userId,
      itemId: item.Id!,
    },
    {
      method: "POST",
      data: {
        deviceProfile,
        userId,
        maxStreamingBitrate,
        startTimeTicks,
        enableTranscoding: maxStreamingBitrate ? true : undefined,
        autoOpenLiveStream: true,
        mediaSourceId,
        allowVideoStreamCopy: maxStreamingBitrate ? false : true,
        audioStreamIndex,
        subtitleStreamIndex,
        deInterlace: true,
        breakOnNonKeyFrames: false,
        copyTimestamps: false,
        enableMpegtsM2TsMode: false,

      },
    }
  );

  sessionId = res2.data.PlaySessionId || null;

  mediaSource = res2.data.MediaSources?.find(
    (source: MediaSourceInfo) => source.Id === mediaSourceId
  );

  console.log("getStreamUrl ~ ", item.MediaType);

  if (item.MediaType === "Video") {
    if (mediaSource?.TranscodingUrl) {
      return {
        url: `${api.basePath}${mediaSource.TranscodingUrl}`,
        sessionId: sessionId,
      };
    }

    if (mediaSource?.SupportsDirectPlay || forceDirectPlay === true) {
      return {
        url: `${api.basePath}/Videos/${itemId}/stream.mp4?playSessionId=${sessionData?.PlaySessionId}&mediaSourceId=${mediaSource?.Id}&static=true&subtitleStreamIndex=${subtitleStreamIndex}&audioStreamIndex=${audioStreamIndex}&deviceId=${api.deviceInfo.id}&api_key=${api.accessToken}`,
        sessionId: sessionId,
      };
    }
  }

  if (item.MediaType === "Audio") {
    console.log("getStreamUrl ~ Audio");

    if (mediaSource?.TranscodingUrl) {
      return { url: `${api.basePath}${mediaSource.TranscodingUrl}`, sessionId };
    }

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
    return {
      url: `${
        api.basePath
      }/Audio/${itemId}/universal?${searchParams.toString()}`,
      sessionId,
    };
  }

  throw new Error("Unsupported media type");
};
