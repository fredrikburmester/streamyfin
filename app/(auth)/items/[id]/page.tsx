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
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from "react-native";
import { ParallaxScrollView } from "./ParallaxPage";
import { Image } from "expo-image";

const page: React.FC = () => {
  const local = useLocalSearchParams();
  const { id } = local as { id: string };

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const { data: item, isLoading: l1 } = useQuery({
    queryKey: ["item", id],
    queryFn: async () =>
      await getUserItemData({
        api,
        userId: user?.Id,
        itemId: id,
      }),
    enabled: !!id && !!api,
    staleTime: 60,
  });

  const { data: posterUrl } = useQuery({
    queryKey: ["backdrop", item?.Id],
    queryFn: async () => getBackdrop(api, item),
    enabled: !!api && !!item?.Id,
    staleTime: 60 * 60 * 24 * 7,
  });

  if (l1)
    return (
      <View className="justify-center items-center h-full">
        <ActivityIndicator />
      </View>
    );

  if (!item?.Id || !posterUrl) return null;

  return (
    <ParallaxScrollView
      headerImage={
        <Image
          source={{
            uri: posterUrl,
          }}
          style={{
            width: "100%",
            height: 250,
          }}
        />
      }
    >
      <View className="flex flex-col px-4 mb-4 pt-4">
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
          <DownloadItem item={item} />
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

      <CastAndCrew item={item} />

      {item.Type === "Episode" && (
        <View className="mb-4">
          <CurrentSeries item={item} />
        </View>
      )}

      <SimilarItems itemId={item.Id} />

      <View className="h-12"></View>
    </ParallaxScrollView>
  );
};

export default page;
