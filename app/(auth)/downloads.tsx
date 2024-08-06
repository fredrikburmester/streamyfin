import { Text } from "@/components/common/Text";
import { EpisodeCard } from "@/components/downloads/EpisodeCard";
import { MovieCard } from "@/components/downloads/MovieCard";
import { SeriesCard } from "@/components/downloads/SeriesCard";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import * as FileSystem from "expo-file-system";

const downloads: React.FC = () => {
  const { data: downloadedFiles, isLoading } = useQuery({
    queryKey: ["downloaded_files"],
    queryFn: async () =>
      JSON.parse(
        (await AsyncStorage.getItem("downloaded_files")) || "[]"
      ) as BaseItemDto[],
  });

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

  useEffect(() => {
    console.log(
      downloadedFiles?.map((i) => ({
        name: i.Name,
        codec: i.SourceType,
        media: i.MediaSources?.[0].Container,
      }))
    );
  }, [downloadedFiles]);

  if (isLoading) {
    return (
      <View className="h-full flex flex-col items-center justify-center -mt-6">
        <ActivityIndicator size="small" color="white" />
      </View>
    );
  }

  if (downloadedFiles?.length === 0) {
    return (
      <View className="h-full flex flex-col items-center justify-center -mt-6">
        <Text className="text-white text-lg font-bold">
          No downloaded files
        </Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View className="px-4 py-4">
        {movies.length > 0 && (
          <View className="mb-4">
            <View className="flex flex-row items-center justify-between mb-2">
              <Text className="text-2xl font-bold">Movies</Text>
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
      </View>
    </ScrollView>
  );
};

export default downloads;
