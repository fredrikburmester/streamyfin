import { useRemuxHlsToMp4 } from "@/hooks/useRemuxHlsToMp4";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { runningProcesses } from "@/utils/atoms/downloads";
import { queueActions, queueAtom } from "@/utils/atoms/queue";
import { getPlaybackInfo } from "@/utils/jellyfin/media/getPlaybackInfo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAtom } from "jotai";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import ProgressCircle from "./ProgressCircle";

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
  const [queue, setQueue] = useAtom(queueAtom);

  const { startRemuxing } = useRemuxHlsToMp4(playbackUrl, item);

  const { data: playbackInfo, isLoading } = useQuery({
    queryKey: ["playbackInfo", item.Id],
    queryFn: async () => getPlaybackInfo(api, item.Id, user?.Id),
  });

  const { data: downloaded, isLoading: isLoadingDownloaded } = useQuery({
    queryKey: ["downloaded", item.Id],
    queryFn: async () => {
      if (!item.Id) return false;

      const data: BaseItemDto[] = JSON.parse(
        (await AsyncStorage.getItem("downloaded_files")) || "[]",
      );

      return data.some((d) => d.Id === item.Id);
    },
    enabled: !!item.Id,
  });

  if (isLoading || isLoadingDownloaded) {
    return (
      <View className="rounded h-10 aspect-square flex items-center justify-center">
        <ActivityIndicator size={"small"} color={"white"} />
      </View>
    );
  }

  if (playbackInfo?.MediaSources?.[0].SupportsDirectPlay === false) {
    return (
      <View className="rounded h-10 aspect-square flex items-center justify-center opacity-50">
        <Ionicons name="cloud-download-outline" size={24} color="white" />
      </View>
    );
  }

  if (process && process?.item.Id === item.Id) {
    return (
      <TouchableOpacity
        onPress={() => {
          router.push("/downloads");
        }}
      >
        <View className="rounded h-10 aspect-square flex items-center justify-center">
          {process.progress === 0 ? (
            <ActivityIndicator size={"small"} color={"white"} />
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
              await startRemuxing();
            },
            item,
          });
        }}
      >
        <View className="rounded h-10 aspect-square flex items-center justify-center">
          <Ionicons name="cloud-download-outline" size={26} color="white" />
        </View>
      </TouchableOpacity>
    );
  }
};
