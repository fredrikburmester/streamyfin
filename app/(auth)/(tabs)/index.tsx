import { HorizontalScroll } from "@/components/common/HorrizontalScroll";
import { Text } from "@/components/common/Text";
import ContinueWatchingPoster from "@/components/ContinueWatchingPoster";
import { ItemCardText } from "@/components/ItemCardText";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { nextUp } from "@/utils/jellyfin";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getItemsApi, getSuggestionsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

export default function index() {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const router = useRouter();

  const { data, isLoading, isError } = useQuery<BaseItemDto[]>({
    queryKey: ["resumeItems", user?.Id],
    queryFn: async () => {
      if (!api || !user?.Id) {
        return [];
      }

      const response = await getItemsApi(api).getResumeItems({
        userId: user.Id,
      });
      return response.data.Items || [];
    },
    enabled: !!api && !!user?.Id,
    staleTime: 60,
  });

  const { data: _nextUpData } = useQuery({
    queryKey: ["nextUp-all", user?.Id],
    queryFn: async () =>
      await nextUp({
        userId: user?.Id,
        api,
      }),
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
    queryFn: async () => {
      if (!api || !user?.Id) {
        return [];
      }
      const response = await getSuggestionsApi(api).getSuggestions({
        userId: user.Id,
        limit: 5,
        mediaType: ["Video"],
      });

      return response.data.Items || [];
    },
    enabled: !!api && !!user?.Id,
    staleTime: 60,
  });

  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    await queryClient.refetchQueries({ queryKey: ["resumeItems", user?.Id] });
    await queryClient.refetchQueries({ queryKey: ["items", user?.Id] });
    await queryClient.refetchQueries({ queryKey: ["suggestions", user?.Id] });
    setLoading(false);
  }, [queryClient, user?.Id]);

  if (isError)
    return (
      <View className="flex flex-col items-center justify-center h-full -mt-12">
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
