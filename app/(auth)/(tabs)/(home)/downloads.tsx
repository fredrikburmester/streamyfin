import { Text } from "@/components/common/Text";
import { ActiveDownloads } from "@/components/downloads/ActiveDownloads";
import { MovieCard } from "@/components/downloads/MovieCard";
import { SeriesCard } from "@/components/downloads/SeriesCard";
import { useDownload } from "@/providers/DownloadProvider";
import { queueAtom } from "@/utils/atoms/queue";
import { useSettings } from "@/utils/atoms/settings";
import { Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const downloads: React.FC = () => {
  const [queue, setQueue] = useAtom(queueAtom);
  const {
    startBackgroundDownload,
    updateProcess,
    removeProcess,
    downloadedFiles,
  } = useDownload();

  const [settings] = useSettings();

  const movies = useMemo(
    () => downloadedFiles?.filter((f) => f.Type === "Movie") || [],
    [downloadedFiles]
  );

  const groupedBySeries = useMemo(() => {
    const episodes = downloadedFiles?.filter((f) => f.Type === "Episode");
    const series: { [key: string]: BaseItemDto[] } = {};
    episodes?.forEach((e) => {
      if (!series[e.SeriesName!]) series[e.SeriesName!] = [];
      series[e.SeriesName!].push(e);
    });
    return Object.values(series);
  }, [downloadedFiles]);

  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: 100,
      }}
    >
      <View className="px-4 py-4">
        <View className="mb-4 flex flex-col space-y-4">
          {settings?.downloadMethod === "remux" && (
            <View>
              <Text className="text-2xl font-bold mb-2">Queue</Text>
              <View className="flex flex-col space-y-2">
                {queue.map((q) => (
                  <TouchableOpacity
                    onPress={() =>
                      router.push(`/(auth)/items/page?id=${q.item.Id}`)
                    }
                    className="relative bg-neutral-900 border border-neutral-800 p-4 rounded-2xl overflow-hidden flex flex-row items-center justify-between"
                  >
                    <View>
                      <Text className="font-semibold">{q.item.Name}</Text>
                      <Text className="text-xs opacity-50">{q.item.Type}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        removeProcess(q.id);
                        setQueue((prev) => {
                          if (!prev) return [];
                          return [...prev.filter((i) => i.id !== q.id)];
                        });
                      }}
                    >
                      <Ionicons name="close" size={24} color="red" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>

              {queue.length === 0 && (
                <Text className="opacity-50">No items in queue</Text>
              )}
            </View>
          )}

          <ActiveDownloads />
        </View>
        {movies.length > 0 && (
          <View className="mb-4">
            <View className="flex flex-row items-center justify-between mb-2">
              <Text className="text-lg font-bold">Movies</Text>
              <View className="bg-purple-600 rounded-full h-6 w-6 flex items-center justify-center">
                <Text className="text-xs font-bold">{movies?.length}</Text>
              </View>
            </View>
            {movies?.map((item: BaseItemDto) => (
              <View className="mb-2 last:mb-0" key={item.Id}>
                <MovieCard item={item} />
              </View>
            ))}
          </View>
        )}
        {groupedBySeries?.map((items: BaseItemDto[], index: number) => (
          <SeriesCard items={items} key={items[0].SeriesId} />
        ))}
        {downloadedFiles?.length === 0 && (
          <View className="flex ">
            <Text className="opacity-50">No downloaded items</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default downloads;
