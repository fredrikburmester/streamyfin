import { Text } from "@/components/common/Text";
import { MovieCard } from "@/components/downloads/MovieCard";
import { SeriesCard } from "@/components/downloads/SeriesCard";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useAtom } from "jotai";
import { runningProcesses } from "@/utils/atoms/downloads";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const downloads: React.FC = () => {
  const { data: downloadedFiles, isLoading } = useQuery({
    queryKey: ["downloaded_files"],
    queryFn: async () =>
      JSON.parse(
        (await AsyncStorage.getItem("downloaded_files")) || "[]",
      ) as BaseItemDto[],
  });

  const movies = useMemo(
    () => downloadedFiles?.filter((f) => f.Type === "Movie") || [],
    [downloadedFiles],
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

  const [process, setProcess] = useAtom(runningProcesses);

  const eta = useMemo(() => {
    const length = process?.item?.RunTimeTicks || 0;

    if (!process?.speed || !process?.progress) return "";

    const timeLeft =
      (length - length * (process.progress / 100)) / process.speed;

    return formatNumber(timeLeft / 10000);
  }, [process]);

  if (isLoading) {
    return (
      <View className="h-full flex flex-col items-center justify-center -mt-6">
        <ActivityIndicator size="small" color="white" />
      </View>
    );
  }

  return (
    <ScrollView>
      <View className="px-4 py-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold mb-2">Active download</Text>
          {process?.item ? (
            <TouchableOpacity
              onPress={() =>
                router.push(`/(auth)/items/${process.item.Id}/page`)
              }
              className="relative bg-neutral-900 border border-neutral-800 p-4 rounded-2xl overflow-hidden flex flex-row items-center justify-between"
            >
              <View>
                <Text className="font-semibold">{process.item.Name}</Text>
                <Text className="text-xs opacity-50">{process.item.Type}</Text>
                <View className="flex flex-row items-center space-x-2 mt-1 text-red-600">
                  <Text className="text-xs">
                    {process.progress.toFixed(0)}%
                  </Text>
                  <Text className="text-xs">{process.speed?.toFixed(2)}x</Text>
                  <View>
                    <Text className="text-xs">ETA {eta}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setProcess(null);
                }}
              >
                <Ionicons name="close" size={24} color="red" />
              </TouchableOpacity>
              <View
                className={`
                  absolute bottom-0 left-0 h-1 bg-red-600
                `}
                style={{
                  width: process.progress
                    ? `${Math.max(5, process.progress)}%`
                    : "5%",
                }}
              ></View>
            </TouchableOpacity>
          ) : (
            <Text className="opacity-50">No active downloads</Text>
          )}
        </View>
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

/*
 * Format a number (Date.getTime) to a human readable string ex. 2m 34s
 * @param {number} num - The number to format
 *
 * @returns {string} - The formatted string
 */
const formatNumber = (num: number) => {
  const minutes = Math.floor(num / 60000);
  const seconds = ((num % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
};
