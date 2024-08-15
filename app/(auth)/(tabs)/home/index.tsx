import { HorizontalScroll } from "@/components/common/HorrizontalScroll";
import { Text } from "@/components/common/Text";
import ContinueWatchingPoster from "@/components/ContinueWatchingPoster";
import { ItemCardText } from "@/components/ItemCardText";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import {
  BaseItemDto,
  ItemFields,
  ItemFilter,
} from "@jellyfin/sdk/lib/generated-client/models";
import {
  getChannelsApi,
  getItemsApi,
  getSuggestionsApi,
  getTvShowsApi,
  getUserApi,
  getUserLibraryApi,
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
import MoviePoster from "@/components/MoviePoster";
import { ScrollingCollectionList } from "@/components/home/ScrollingCollectionList";
import { useSettings } from "@/utils/atoms/settings";

export default function index() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [loading, setLoading] = useState(false);
  const [settings, _] = useSettings();

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

  const { data: _nextUpData, isLoading: isLoadingNextUp } = useQuery({
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

  const { data: collections, isLoading: isLoadingCollections } = useQuery({
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

      console.log("Collections", JSON.stringify(data.Items));

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

  const movieCollectionId = useMemo(() => {
    return collections?.find((c) => c.CollectionType === "movies")?.Id;
  }, [collections]);

  const tvShowCollectionId = useMemo(() => {
    return collections?.find((c) => c.CollectionType === "tvshows")?.Id;
  }, [collections]);

  const {
    data: recentlyAddedInMovies,
    isLoading: isLoadingRecentlyAddedMovies,
  } = useQuery<BaseItemDto[]>({
    queryKey: ["recentlyAddedInMovies", user?.Id, movieCollectionId],
    queryFn: async () =>
      (api &&
        (
          await getUserLibraryApi(api).getLatestMedia({
            userId: user?.Id,
            limit: 50,
            fields: ["PrimaryImageAspectRatio", "Path"],
            imageTypeLimit: 1,
            enableImageTypes: ["Primary", "Backdrop", "Thumb"],
            parentId: movieCollectionId,
          })
        ).data) ||
      [],
    enabled: !!api && !!user?.Id && !!movieCollectionId,
    staleTime: 60,
  });

  const {
    data: recentlyAddedInTVShows,
    isLoading: isLoadingRecentlyAddedTVShows,
  } = useQuery<BaseItemDto[]>({
    queryKey: ["recentlyAddedInTVShows", user?.Id, tvShowCollectionId],
    queryFn: async () =>
      (api &&
        (
          await getUserLibraryApi(api).getLatestMedia({
            userId: user?.Id,
            limit: 50,
            fields: ["PrimaryImageAspectRatio", "Path"],
            imageTypeLimit: 1,
            enableImageTypes: ["Primary", "Backdrop", "Thumb"],
            parentId: tvShowCollectionId,
          })
        ).data) ||
      [],
    enabled: !!api && !!user?.Id && !!tvShowCollectionId,
    staleTime: 60,
  });

  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery<
    BaseItemDto[]
  >({
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

  const { data: mediaListCollection } = useQuery<string | null>({
    queryKey: ["mediaListCollection", user?.Id],
    queryFn: async () => {
      if (!api || !user?.Id) return null;

      const response = await getItemsApi(api).getItems({
        userId: user.Id,
        tags: ["medialist", "promoted"],
        recursive: true,
        fields: ["Tags"],
        includeItemTypes: ["BoxSet"],
      });

      return response.data.Items?.[0].Id || null;
    },
    enabled: !!api && !!user?.Id && settings?.usePopularPlugin === true,
    staleTime: 60,
  });

  const { data: popularItems, isLoading: isLoadingPopular } = useQuery<
    BaseItemDto[]
  >({
    queryKey: ["popular", user?.Id],
    queryFn: async () => {
      if (!api || !user?.Id || !mediaListCollection) return [];

      const response = await getItemsApi(api).getItems({
        userId: user.Id,
        parentId: mediaListCollection,
        limit: 10,
      });

      console.log("Popular", response.data.Items?.length);

      return response.data.Items || [];
    },
    enabled: !!api && !!user?.Id && !!mediaListCollection,
    staleTime: 60,
  });

  const refetch = useCallback(async () => {
    setLoading(true);
    await queryClient.refetchQueries({ queryKey: ["resumeItems", user?.Id] });
    await queryClient.refetchQueries({ queryKey: ["items", user?.Id] });
    await queryClient.refetchQueries({ queryKey: ["suggestions", user?.Id] });
    await queryClient.refetchQueries({ queryKey: ["recentlyAddedInMovies"] });
    setLoading(false);
  }, [queryClient, user?.Id]);

  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected == false || state.isInternetReachable === false)
        setIsConnected(false);
      else setIsConnected(true);
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
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refetch} />
      }
    >
      <View className="flex flex-col pt-4 pb-24 gap-y-4">
        <ScrollingCollectionList
          title="Continue Watching"
          data={data}
          loading={isLoading}
          orientation="horizontal"
        />

        <ScrollingCollectionList
          title="Popular"
          data={popularItems}
          loading={isLoadingPopular}
          disabled={!mediaListCollection}
        />

        <ScrollingCollectionList
          title="Next Up"
          data={nextUpData}
          loading={isLoadingNextUp}
          orientation="horizontal"
        />

        <ScrollingCollectionList
          title="Recently Added in Movies"
          data={recentlyAddedInMovies}
          loading={isLoadingRecentlyAddedMovies}
        />

        <ScrollingCollectionList
          title="Recently Added in TV-Shows"
          data={recentlyAddedInTVShows}
          loading={isLoadingRecentlyAddedTVShows}
        />

        <ScrollingCollectionList
          title="Collections"
          data={collections}
          loading={isLoadingCollections}
          orientation="horizontal"
        />

        <ScrollingCollectionList
          title="Suggestions"
          data={suggestions}
          loading={isLoadingSuggestions}
          orientation="horizontal"
        />
      </View>
    </ScrollView>
  );
}
