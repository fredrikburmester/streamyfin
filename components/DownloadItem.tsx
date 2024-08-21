import { useRemuxHlsToMp4 } from "@/hooks/useRemuxHlsToMp4";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { runningProcesses } from "@/utils/atoms/downloads";
import { queueActions, queueAtom } from "@/utils/atoms/queue";
import { getPlaybackInfo } from "@/utils/jellyfin/media/getPlaybackInfo";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BaseItemDto,
  MediaSourceInfo,
} from "@jellyfin/sdk/lib/generated-client/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAtom } from "jotai";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
} from "react-native";
import { Loader } from "./Loader";
import ProgressCircle from "./ProgressCircle";
import { DownloadQuality, useSettings } from "@/utils/atoms/settings";
import { useCallback } from "react";
import ios from "@/utils/profiles/ios";
import native from "@/utils/profiles/native";
import old from "@/utils/profiles/old";

interface DownloadProps extends TouchableOpacityProps {
  item: BaseItemDto;
}

export const DownloadItem: React.FC<DownloadProps> = ({ item, ...props }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const [process] = useAtom(runningProcesses);
  const [queue, setQueue] = useAtom(queueAtom);

  const [settings] = useSettings();

  const { startRemuxing } = useRemuxHlsToMp4(item);

  const initiateDownload = useCallback(
    async (qualitySetting: DownloadQuality) => {
      if (!api || !user?.Id || !item.Id) {
        throw new Error(
          "DownloadItem ~ initiateDownload: No api or user or item"
        );
      }

      let deviceProfile: any = ios;

      if (settings?.deviceProfile === "Native") {
        deviceProfile = native;
      } else if (settings?.deviceProfile === "Old") {
        deviceProfile = old;
      }

      let maxStreamingBitrate: number | undefined = undefined;

      if (qualitySetting === "high") {
        maxStreamingBitrate = 8000000;
      } else if (qualitySetting === "low") {
        maxStreamingBitrate = 2000000;
      }

      const response = await api.axiosInstance.post(
        `${api.basePath}/Items/${item.Id}/PlaybackInfo`,
        {
          DeviceProfile: deviceProfile,
          UserId: user.Id,
          MaxStreamingBitrate: maxStreamingBitrate,
          StartTimeTicks: 0,
          EnableTranscoding: maxStreamingBitrate ? true : undefined,
          AutoOpenLiveStream: true,
          MediaSourceId: item.Id,
          AllowVideoStreamCopy: maxStreamingBitrate ? false : true,
        },
        {
          headers: {
            Authorization: `MediaBrowser DeviceId="${api.deviceInfo.id}", Token="${api.accessToken}"`,
          },
        }
      );

      let url: string | undefined = undefined;

      const mediaSource = response.data.MediaSources?.[0] as MediaSourceInfo;

      if (!mediaSource) {
        throw new Error("No media source");
      }

      if (mediaSource.SupportsDirectPlay) {
        if (item.MediaType === "Video") {
          console.log("Using direct stream for video!");
          url = `${api.basePath}/Videos/${item.Id}/stream.mp4?mediaSourceId=${item.Id}&static=true`;
        } else if (item.MediaType === "Audio") {
          console.log("Using direct stream for audio!");
          const searchParams = new URLSearchParams({
            UserId: user.Id,
            DeviceId: api.deviceInfo.id,
            MaxStreamingBitrate: "140000000",
            Container:
              "opus,webm|opus,mp3,aac,m4a|aac,m4b|aac,flac,webma,webm|webma,wav,ogg",
            TranscodingContainer: "mp4",
            TranscodingProtocol: "hls",
            AudioCodec: "aac",
            api_key: api.accessToken,
            StartTimeTicks: "0",
            EnableRedirection: "true",
            EnableRemoteMedia: "false",
          });
          url = `${api.basePath}/Audio/${
            item.Id
          }/universal?${searchParams.toString()}`;
        }
      }

      if (mediaSource.TranscodingUrl) {
        console.log("Using transcoded stream!");
        url = `${api.basePath}${mediaSource.TranscodingUrl}`;
      } else {
        throw new Error("No transcoding url");
      }

      return await startRemuxing(url);
    },
    [api, item, startRemuxing, user?.Id]
  );

  const { data: downloaded, isFetching } = useQuery({
    queryKey: ["downloaded", item.Id],
    queryFn: async () => {
      if (!item.Id) return false;

      const data: BaseItemDto[] = JSON.parse(
        (await AsyncStorage.getItem("downloaded_files")) || "[]"
      );

      return data.some((d) => d.Id === item.Id);
    },
    enabled: !!item.Id,
  });

  if (isFetching) {
    return (
      <View className="rounded h-10 aspect-square flex items-center justify-center">
        <Loader />
      </View>
    );
  }

  if (process && process?.item.Id === item.Id) {
    return (
      <TouchableOpacity
        onPress={() => {
          router.push("/downloads");
        }}
        {...props}
      >
        <View className="rounded h-10 aspect-square flex items-center justify-center">
          {process.progress === 0 ? (
            <Loader />
          ) : (
            <View className="-rotate-45">
              <ProgressCircle
                size={24}
                fill={process.progress}
                width={4}
                tintColor="#9334E9"
                backgroundColor="#bdc3c7"
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (queue.some((i) => i.id === item.Id)) {
    return (
      <TouchableOpacity
        onPress={() => {
          router.push("/downloads");
        }}
        {...props}
      >
        <View className="rounded h-10 aspect-square flex items-center justify-center opacity-50">
          <Ionicons name="hourglass" size={24} color="white" />
        </View>
      </TouchableOpacity>
    );
  }

  if (downloaded) {
    return (
      <TouchableOpacity
        onPress={() => {
          router.push("/downloads");
        }}
        {...props}
      >
        <View className="rounded h-10 aspect-square flex items-center justify-center">
          <Ionicons name="cloud-download" size={26} color="#9333ea" />
        </View>
      </TouchableOpacity>
    );
  } else {
    return (
      <TouchableOpacity
        onPress={() => {
          queueActions.enqueue(queue, setQueue, {
            id: item.Id!,
            execute: async () => {
              // await startRemuxing(playbackUrl);
              if (!settings?.downloadQuality?.value) {
                throw new Error("No download quality selected");
              }
              await initiateDownload(settings?.downloadQuality?.value);
            },
            item,
          });
        }}
        {...props}
      >
        <View className="rounded h-10 aspect-square flex items-center justify-center">
          <Ionicons name="cloud-download-outline" size={26} color="white" />
        </View>
      </TouchableOpacity>
    );
  }
};
