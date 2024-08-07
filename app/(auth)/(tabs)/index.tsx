import { HorizontalScroll } from "@/components/common/HorrizontalScroll";
import { Text } from "@/components/common/Text";
import ContinueWatchingPoster from "@/components/ContinueWatchingPoster";
import { ItemCardText } from "@/components/ItemCardText";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import {
  getItemsApi,
  getSuggestionsApi,
  getTvShowsApi,
} from "@jellyfin/sdk/lib/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { Button } from "@/components/Button";
import { Ionicons } from "@expo/vector-icons";

export default function index() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [loading, setLoading] = useState(false);

  const { data, isLoading, isError } = useQuery<BaseItemDto[]>({
    queryKey: ["resumeItems", user?.Id],
    queryFn: async () =>
      (api &&
        (
          await getItemsApi(api).getResumeItems({
            userId: user?.Id,
          })
        ).data.Items) ||
      [],
    enabled: !!api && !!user?.Id,
    staleTime: 60,
  });

  const { data: _nextUpData } = useQuery({
    queryKey: ["nextUp-all", user?.Id],
    queryFn: async () =>
      (api &&
        (
          await getTvShowsApi(api).getNextUp({
            userId: user?.Id,
            fields: ["MediaSourceCount"],
          })
        ).data.Items) ||
      [],
    enabled: !!api && !!user?.Id,
    staleTime: 0,
  });

  const nextUpData = useMemo(() => {
    return _nextUpData?.filter((i) => !data?.find((d) => d.Id === i.Id));
  }, [_nextUpData]);

  const { data: collections } = useQuery({
    queryKey: ["collections", user?.Id],
    queryFn: async () => {
      if (!api || !user?.Id) {
        return [];
      }

      const data = (
        await getItemsApi(api).getItems({
          userId: user.Id,
        })
      ).data;

      const order = ["boxsets", "tvshows", "movies"];

      const cs = data.Items?.sort((a, b) => {
        if (
          order.indexOf(a.CollectionType!) < order.indexOf(b.CollectionType!)
        ) {
          return 1;
        }

        return -1;
      });

      return data.Items || [];
    },
    enabled: !!api && !!user?.Id,
    staleTime: 0,
  });

  const { data: suggestions } = useQuery<BaseItemDto[]>({
    queryKey: ["suggestions", user?.Id],
    queryFn: async () =>
      (api &&
        (
          await getSuggestionsApi(api).getSuggestions({
            userId: user?.Id,
            limit: 5,
            mediaType: ["Video"],
          })
        ).data.Items) ||
      [],
    enabled: !!api && !!user?.Id,
    staleTime: 60,
  });

  const refetch = useCallback(async () => {
    setLoading(true);
    await queryClient.refetchQueries({ queryKey: ["resumeItems", user?.Id] });
    await queryClient.refetchQueries({ queryKey: ["items", user?.Id] });
    await queryClient.refetchQueries({ queryKey: ["suggestions", user?.Id] });
    setLoading(false);
  }, [queryClient, user?.Id]);

  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isConnected === false) {
    return (
      <View className="flex flex-col items-center justify-center h-full -mt-6 px-8">
        <Text className="text-3xl font-bold mb-2">No Internet</Text>
        <Text className="text-center opacity-70">
          No worries, you can still watch{"\n"}downloaded content.
        </Text>
        <View className="mt-4">
          <Button
            color="purple"
            onPress={() => router.push("/(auth)/downloads")}
            justify="center"
            iconRight={
              <Ionicons name="arrow-forward" size={20} color="white" />
            }
          >
            Go to downloads
          </Button>
        </View>
      </View>
    );
  }

  if (isError)
    return (
      <View className="flex flex-col items-center justify-center h-full -mt-6">
        <Text className="text-3xl font-bold mb-2">Oops!</Text>
        <Text className="text-center opacity-70">
          Something went wrong.{"\n"}Please log out and in again.
        </Text>
      </View>
    );

  if (isLoading)
    return (
      <View className="justify-center items-center h-full">
        <ActivityIndicator />
      </View>
    );

  return (
    <ScrollView
      nestedScrollEnabled
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refetch} />
      }
    >
      <View className="py-4 gap-y-2">
        <Text className="px-4 text-2xl font-bold mb-2">Continue Watching</Text>
        <HorizontalScroll<BaseItemDto>
          data={data}
          renderItem={(item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(`/items/${item.Id}/page`)}
              className="flex flex-col w-48"
            >
              <View>
                <ContinueWatchingPoster item={item} />
                <ItemCardText item={item} />
              </View>
            </TouchableOpacity>
          )}
        />
        <Text className="px-4 text-2xl font-bold mb-2">Next Up</Text>
        <HorizontalScroll<BaseItemDto>
          data={nextUpData}
          renderItem={(item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(`/items/${item.Id}/page`)}
              className="flex flex-col w-48"
            >
              <View>
                <ContinueWatchingPoster item={item} />
                <ItemCardText item={item} />
              </View>
            </TouchableOpacity>
          )}
        />
        <Text className="px-4 text-2xl font-bold mb-2">Collections</Text>
        <HorizontalScroll<BaseItemDto>
          data={collections}
          renderItem={(item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(`/collections/${item.Id}/page`)}
              className="flex flex-col w-48"
            >
              <View>
                <ContinueWatchingPoster item={item} />
                <ItemCardText item={item} />
              </View>
            </TouchableOpacity>
          )}
        />
        <Text className="px-4 text-2xl font-bold mb-2">Suggestions</Text>
        <HorizontalScroll<BaseItemDto>
          data={suggestions}
          renderItem={(item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(`/items/${item.Id}/page`)}
              className="flex flex-col w-48"
            >
              <ContinueWatchingPoster item={item} />
              <ItemCardText item={item} />
            </TouchableOpacity>
          )}
        />
      </View>
    </ScrollView>
  );
}
