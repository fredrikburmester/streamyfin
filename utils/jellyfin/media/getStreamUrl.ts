import native from "@/utils/profiles/native";
import { Api } from "@jellyfin/sdk";
import {
  BaseItemDto,
  MediaSourceInfo,
  PlaybackInfoResponse,
} from "@jellyfin/sdk/lib/generated-client/models";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api";

export const getStreamUrl = async ({
  api,
  item,
  userId,
  startTimeTicks = 0,
  maxStreamingBitrate,
  sessionData,
  deviceProfile = native,
  audioStreamIndex = 0,
  subtitleStreamIndex = undefined,
  mediaSourceId,
}: {
  api: Api | null | undefined;
  item: BaseItemDto | null | undefined;
  userId: string | null | undefined;
  startTimeTicks: number;
  maxStreamingBitrate?: number;
  sessionData?: PlaybackInfoResponse | null;
  deviceProfile?: any;
  audioStreamIndex?: number;
  subtitleStreamIndex?: number;
  height?: number;
  mediaSourceId?: string | null;
}): Promise<{
  url: string | null;
  sessionId: string | null;
  mediaSource: MediaSourceInfo | undefined;
} | null> => {
  if (!api || !userId || !item?.Id) {
    return null;
  }

  let mediaSource: MediaSourceInfo | undefined;
  let sessionId: string | null | undefined;

  if (item.Type === "Program") {
    console.log("Item is of type program...");
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
      return {
        url: `${api.basePath}${transcodeUrl}`,
        sessionId,
        mediaSource: res0.data.MediaSources?.[0],
      };
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
        userId,
        maxStreamingBitrate,
        startTimeTicks,
        autoOpenLiveStream: true,
        mediaSourceId,
        audioStreamIndex,
        subtitleStreamIndex,
      },
    }
  );

  if (res2.status !== 200) {
    console.error("Error getting playback info:", res2.status, res2.statusText);
  }

  sessionId = res2.data.PlaySessionId || null;

  mediaSource = res2.data.MediaSources?.find(
    (source: MediaSourceInfo) => source.Id === mediaSourceId
  );

  if (item.MediaType === "Video") {
    if (mediaSource?.TranscodingUrl) {
      const urlObj = new URL(api.basePath + mediaSource?.TranscodingUrl); // Create a URL object

      // If there is no subtitle stream index, add it to the URL.
      if (subtitleStreamIndex == -1) {
        urlObj.searchParams.set("SubtitleMethod", "Hls");
      }

      // Add 'SubtitleMethod=Hls' if it doesn't exist
      if (!urlObj.searchParams.has("SubtitleMethod")) {
        urlObj.searchParams.append("SubtitleMethod", "Hls");
      }
      // Get the updated URL
      const transcodeUrl = urlObj.toString();

      console.log("Video has transcoding URL:", `${transcodeUrl}`);
      return {
        url: transcodeUrl,
        sessionId: sessionId,
        mediaSource,
      };
    }

    if (mediaSource?.SupportsDirectPlay) {
      const searchParams = new URLSearchParams({
        playSessionId: sessionData?.PlaySessionId || "",
        mediaSourceId: mediaSource?.Id || "",
        static: "true",
        subtitleStreamIndex: subtitleStreamIndex?.toString() || "",
        audioStreamIndex: audioStreamIndex?.toString() || "",
        deviceId: api.deviceInfo.id,
        api_key: api.accessToken,
        startTimeTicks: startTimeTicks.toString(),
        maxStreamingBitrate: maxStreamingBitrate?.toString() || "",
        userId: userId || "",
      });

      const directPlayUrl = `${
        api.basePath
      }/Videos/${itemId}/stream.mp4?${searchParams.toString()}`;

      console.log("Video is being direct played:", directPlayUrl);

      return {
        url: directPlayUrl,
        sessionId: sessionId,
        mediaSource,
      };
    }
  }

  if (item.MediaType === "Audio") {
    if (mediaSource?.TranscodingUrl) {
      return {
        url: `${api.basePath}${mediaSource.TranscodingUrl}`,
        sessionId,
        mediaSource,
      };
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
      mediaSource,
    };
  }

  throw new Error("Unsupported media type");
};
