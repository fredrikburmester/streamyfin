import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { runningProcesses } from "@/utils/atoms/downloads";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import ProgressCircle from "./ProgressCircle";
import { Text } from "./common/Text";
import { useDownloadMedia } from "@/hooks/useDownloadMedia";
import { useRemuxHlsToMp4 } from "@/hooks/useRemuxHlsToMp4";
import { getPlaybackInfo } from "@/utils/jellyfin/media/getPlaybackInfo";

type DownloadProps = {
  item: BaseItemDto;
  playbackUrl: string;
};

export const DownloadItem: React.FC<DownloadProps> = ({
  item,
  playbackUrl,
}) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const [process] = useAtom(runningProcesses);

  const { downloadMedia, isDownloading, error, cancelDownload } =
    useDownloadMedia(api, user?.Id);

  const { startRemuxing, cancelRemuxing } = useRemuxHlsToMp4(playbackUrl, item);

  const { data: playbackInfo, isLoading } = useQuery({
    queryKey: ["playbackInfo", item.Id],
    queryFn: async () => getPlaybackInfo(api, item.Id, user?.Id),
  });

  const downloadFile = useCallback(async () => {
    if (!playbackInfo) return;

    const source = playbackInfo.MediaSources?.[0];

    if (source?.SupportsDirectPlay && item.CanDownload) {
      downloadMedia(item);
    } else {
      throw new Error(
        "Direct play not supported thus the file cannot be downloaded",
      );
    }
  }, [item, user, playbackInfo]);

  const [downloaded, setDownloaded] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const data: BaseItemDto[] = JSON.parse(
        (await AsyncStorage.getItem("downloaded_files")) || "[]",
      );

      if (data.find((d) => d.Id === item.Id)) setDownloaded(true);
    })();
  }, [process]);

  if (isLoading) {
    return (
      <View className="rounded h-12 aspect-square flex items-center justify-center">
        <ActivityIndicator size={"small"} color={"white"} />
      </View>
    );
  }

  if (playbackInfo?.MediaSources?.[0].SupportsDirectPlay === false) {
    return (
      <View className="rounded h-12 aspect-square flex items-center justify-center opacity-50">
        <Ionicons name="cloud-download-outline" size={24} color="white" />
      </View>
    );
  }

  if (process && process.item.Id !== item.Id!) {
    return (
      <TouchableOpacity onPress={() => {}}>
        <View className="rounded h-12 aspect-square flex items-center justify-center opacity-50">
          <Ionicons name="cloud-download-outline" size={24} color="white" />
        </View>
      </TouchableOpacity>
    );
  }

  if (process) {
    return (
      <TouchableOpacity
        onPress={() => {
          router.push("/downloads");
        }}
      >
        <View className="rounded h-12 aspect-square flex items-center justify-center">
          {process.progress === 0 ? (
            <ActivityIndicator size={"small"} color={"white"} />
          ) : (
            <View className="relative">
              <View className="-rotate-45">
                <ProgressCircle
                  size={28}
                  fill={process.progress}
                  width={4}
                  tintColor="#3498db"
                  backgroundColor="#bdc3c7"
                />
              </View>
              <View className="absolute top-0 left-0 font-bold w-full h-full flex flex-col items-center justify-center">
                <Text className="text-[7px]">
                  {process.progress.toFixed(0)}%
                </Text>
              </View>
            </View>
          )}

          {process?.speed && process.speed > 0 ? (
            <View className="ml-2">
              <Text>{process.speed.toFixed(2)}x</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  } else if (downloaded) {
    return (
      <TouchableOpacity
        onPress={() => {
          router.push("/downloads");
        }}
      >
        <View className="rounded h-12 aspect-square flex items-center justify-center">
          <Ionicons name="cloud-download" size={26} color="#9333ea" />
        </View>
      </TouchableOpacity>
    );
  } else {
    return (
      <TouchableOpacity
        onPress={() => {
          startRemuxing();
        }}
      >
        <View className="rounded h-12 aspect-square flex items-center justify-center">
          <Ionicons name="cloud-download-outline" size={26} color="white" />
        </View>
      </TouchableOpacity>
    );
  }
};
