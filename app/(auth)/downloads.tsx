import { Text } from "@/components/common/Text";
import { EpisodeCard } from "@/components/downloads/EpisodeCard";
import { MovieCard } from "@/components/downloads/MovieCard";
import { SeriesCard } from "@/components/downloads/SeriesCard";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { ScrollView, View } from "react-native";
import * as FileSystem from "expo-file-system";

const downloads: React.FC = () => {
  const { data: downloadedFiles } = useQuery({
    queryKey: ["downloaded_files"],
    queryFn: async () =>
      JSON.parse(
        (await AsyncStorage.getItem("downloaded_files")) || "[]"
      ) as BaseItemDto[],
  });

  const movies = useMemo(
    () => downloadedFiles?.filter((f) => f.Type === "Movie"),
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

  useEffect(() => {
    // Get all files from FileStorage
    // const filename = `${itemId}.mp4`;
    // const fileUri = `${FileSystem.documentDirectory}`;
    (async () => {
      if (!FileSystem.documentDirectory) return;
      const f = await FileSystem.readDirectoryAsync(
        FileSystem.documentDirectory
      );
      console.log("files", FileSystem.documentDirectory, f);
    })();
  }, []);

  return (
    <ScrollView>
      <View className="px-4 py-4">
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
        <View>
          {groupedBySeries?.map((items: BaseItemDto[], index: number) => (
            <SeriesCard items={items} key={items[0].SeriesId} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default downloads;
