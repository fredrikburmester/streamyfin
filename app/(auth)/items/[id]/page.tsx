import { LargePoster } from "@/components/common/LargePoster";
import { Text } from "@/components/common/Text";
import { DownloadItem } from "@/components/DownloadItem";
import { PlayedStatus } from "@/components/PlayedStatus";
import { CastAndCrew } from "@/components/series/CastAndCrew";
import { CurrentSeries } from "@/components/series/CurrentSeries";
import { SimilarItems } from "@/components/SimilarItems";
import { VideoPlayer } from "@/components/VideoPlayer";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { getBackdrop, getStreamUrl, getUserItemData } from "@/utils/jellyfin";
import { Ionicons } from "@expo/vector-icons";
import {} from "@jellyfin/sdk/lib/utils/url";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

const page: React.FC = () => {
  const local = useLocalSearchParams();
  const { id } = local as { id: string };

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const navigation = useNavigation();

  const { data: item, isLoading: l1 } = useQuery({
    queryKey: ["item", id],
    queryFn: async () =>
      await getUserItemData({
        api,
        userId: user?.Id,
        itemId: id,
      }),
    enabled: !!id && !!api,
    staleTime: Infinity,
  });

  const { data: playbackURL, isLoading: l2 } = useQuery({
    queryKey: ["playbackUrl", id],
    queryFn: async () => {
      if (!api || !user?.Id) return;
      return await getStreamUrl({
        api,
        userId: user.Id,
        item,
        startTimeTicks: item?.UserData?.PlaybackPositionTicks || 0,
      });
    },
    enabled: !!id && !!api && !!user?.Id && !!item,
    staleTime: Infinity,
  });

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        <Ionicons name="accessibility" />;
      },
    });
  }, [item, playbackURL, navigation]);

  const { data: posterUrl } = useQuery({
    queryKey: ["backdrop", item?.Id],
    queryFn: async () => getBackdrop(api, item),
    enabled: !!api && !!item?.Id,
    staleTime: Infinity,
  });

  if (l1 || l2)
    return (
      <View className="justify-center items-center h-full">
        <ActivityIndicator />
      </View>
    );

  if (!item?.Id) return null;
  if (!playbackURL) return null;

  return (
    <ScrollView style={[{ flex: 1 }]} keyboardDismissMode="on-drag">
      <LargePoster url={posterUrl} />
      <View className="flex flex-col px-4 mb-4">
        <View className="flex flex-col">
          {item.Type === "Episode" ? (
            <>
              <Text className="text-center opacity-50">{item?.SeriesName}</Text>
              <Text className="text-center font-bold text-2xl">
                {item?.Name}
              </Text>
              <Text className="text-center opacity-50">
                {`S${item?.SeasonName?.replace("Season ", "")}:E${(
                  item.IndexNumber || 0
                ).toString()}`}
                {" - "}
                {item.ProductionYear}
              </Text>
            </>
          ) : (
            <>
              <Text className="text-center font-bold text-2xl">
                {item?.Name}
              </Text>
              <Text className="text-center opacity-50">
                {item?.ProductionYear}
              </Text>
            </>
          )}
        </View>

        <View className="flex flex-row justify-center items-center w-full my-4 space-x-4">
          {playbackURL && <DownloadItem item={item} url={playbackURL} />}
          <View className="ml-4">
            <PlayedStatus item={item} />
          </View>
        </View>
        <Text>{item.Overview}</Text>
      </View>
      <View className="flex flex-col p-4">
        <VideoPlayer itemId={item.Id} />
      </View>
      <ScrollView horizontal className="flex px-4 mb-4">
        <View className="flex flex-row space-x-2 ">
          <View className="flex flex-col">
            <Text className="text-sm opacity-70">Video</Text>
            <Text className="text-sm opacity-70">Audio</Text>
            <Text className="text-sm opacity-70">Subtitles</Text>
          </View>
          <View className="flex flex-col">
            <Text className="text-sm opacity-70">
              {item.MediaStreams?.find((i) => i.Type === "Video")?.DisplayTitle}
            </Text>
            <Text className="text-sm opacity-70">
              {item.MediaStreams?.find((i) => i.Type === "Audio")?.DisplayTitle}
            </Text>
            <Text className="text-sm opacity-70">
              {
                item.MediaStreams?.find((i) => i.Type === "Subtitle")
                  ?.DisplayTitle
              }
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="px-4 mb-4">
        <CastAndCrew item={item} />
      </View>

      {item.Type === "Episode" && (
        <View className="px-4 mb-4">
          <CurrentSeries item={item} />
        </View>
      )}

      <SimilarItems itemId={item.Id} />

      <View className="h-12"></View>
    </ScrollView>
  );
};

export default page;
