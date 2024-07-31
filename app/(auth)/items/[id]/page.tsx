import { Text } from "@/components/common/Text";
import { DownloadItem } from "@/components/DownloadItem";
import { SimilarItems } from "@/components/SimilarItems";
import { VideoPlayer } from "@/components/VideoPlayer";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { getBackdrop, getStreamUrl, getUserItemData } from "@/utils/jellyfin";
import { Ionicons } from "@expo/vector-icons";
import {} from "@jellyfin/sdk/lib/utils/url";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { useAtom } from "jotai";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  View,
} from "react-native";

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

  const screenWidth = Dimensions.get("window").width;

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

  const { data: url } = useQuery({
    queryKey: ["backdrop", item?.Id],
    queryFn: async () => getBackdrop(api, item),
    enabled: !!api && !!item?.Id,
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
    <ScrollView style={[{ flex: 1 }]}>
      {posterUrl && (
        <View className="p-4 rounded-xl overflow-hidden ">
          <Image
            source={{ uri: posterUrl }}
            className="w-full aspect-video rounded-xl overflow-hidden border border-neutral-800"
          />
        </View>
      )}
      <View className="flex flex-col text-center px-4 mb-4">
        <View className="flex flex-col">
          {item.Type === "Episode" ? (
            <>
              <Text className="text-center opacity-50">{item?.SeriesName}</Text>
              <Text className="text-center font-bold text-2xl">
                {item?.Name}
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

        <View className="justify-center items-center w-full my-4">
          {playbackURL && <DownloadItem item={item} url={playbackURL} />}
        </View>
        <Text>{item.Overview}</Text>
      </View>
      <View className="flex flex-col p-4">
        <VideoPlayer itemId={item.Id} />
      </View>
      <SimilarItems itemId={item.Id} />
    </ScrollView>
  );
};

export default page;
