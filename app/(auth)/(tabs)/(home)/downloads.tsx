import { Text } from "@/components/common/Text";
import { MovieCard } from "@/components/downloads/MovieCard";
import { SeriesCard } from "@/components/downloads/SeriesCard";
import { Loader } from "@/components/Loader";
import { getAllDownloadedItems } from "@/hooks/useDownloadM3U8Files";
import { runningProcesses } from "@/utils/atoms/downloads";
import { queueAtom } from "@/utils/atoms/queue";
import { Ionicons } from "@expo/vector-icons";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import { FFmpegKit } from "ffmpeg-kit-react-native";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const downloads: React.FC = () => {
  const [process, setProcess] = useAtom(runningProcesses);
  const [queue, setQueue] = useAtom(queueAtom);

  const { data: downloadedFiles, isLoading } = useQuery({
    queryKey: ["downloaded_files", process?.item.Id],
    queryFn: getAllDownloadedItems,
    staleTime: 0,
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

  const eta = useMemo(() => {
    const length = process?.item?.RunTimeTicks || 0;

    if (!process?.speed || !process?.progress) return "";

    const timeLeft =
      (length - length * (process.progress / 100)) / process.speed;

    return formatNumber(timeLeft / 10000);
  }, [process]);

  useEffect(() => {
    (async () => {
      const dir = FileSystem.documentDirectory;
      if (dir) {
        const items = await FileSystem.readDirectoryAsync(dir);

        if (items.length === 0) {
          console.log("No items found in the document directory.");
          return;
        }

        for (const item of items) {
          const fullPath = `${dir}${item}`;
          const info = await FileSystem.getInfoAsync(fullPath);

          if (info.exists) {
            if (info.isDirectory) {
              // List items in the directory
              const subItems = await FileSystem.readDirectoryAsync(fullPath);
              if (subItems.length === 0) {
                console.log(`Directory ${item} is empty.`);
              } else {
                console.log(`Items in ${item}:`, subItems);
                // If item ends in m3u8, print the content of the file
                const m3u8Files = subItems.filter((subItem) =>
                  subItem.endsWith(".m3u8")
                );
                if (m3u8Files.length === 0) {
                  console.log(`No .m3u8 files found in ${item}.`);
                } else {
                  for (let subItem of m3u8Files) {
                    console.log(
                      `Content of ${subItem}:`,
                      await FileSystem.readAsStringAsync(
                        `${fullPath}/${subItem}`
                      )
                    );
                  }
                }
              }
            } else {
              console.log(`${item} is a file`);
            }
          } else {
            console.log(`${item} does not exist.`);
          }
        }
      } else {
        console.log("Document directory is not available.");
      }
    })();
  }, []);

  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View className="h-full flex flex-col items-center justify-center -mt-6">
        <Loader />
      </View>
    );
  }

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
                      setQueue((prev) => prev.filter((i) => i.id !== q.id));
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

          <View>
            <Text className="text-2xl font-bold mb-2">Active download</Text>
            {process?.item ? (
              <TouchableOpacity
                onPress={() =>
                  router.push(`/(auth)/items/page?id=${process.item.Id}`)
                }
                className="relative bg-neutral-900 border border-neutral-800 p-4 rounded-2xl overflow-hidden flex flex-row items-center justify-between"
              >
                <View>
                  <Text className="font-semibold">{process.item.Name}</Text>
                  <Text className="text-xs opacity-50">
                    {process.item.Type}
                  </Text>
                  <View className="flex flex-row items-center space-x-2 mt-1 text-purple-600">
                    <Text className="text-xs">
                      {process.progress.toFixed(0)}%
                    </Text>
                    <Text className="text-xs">
                      {process.speed?.toFixed(2)}x
                    </Text>
                    <View>
                      <Text className="text-xs">ETA {eta}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    FFmpegKit.cancel();
                    setProcess(null);
                  }}
                >
                  <Ionicons name="close" size={24} color="red" />
                </TouchableOpacity>
                <View
                  className={`
                  absolute bottom-0 left-0 h-1 bg-purple-600
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
