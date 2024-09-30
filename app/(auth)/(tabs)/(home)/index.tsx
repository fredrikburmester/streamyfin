import { Button } from "@/components/Button";
import { Text } from "@/components/common/Text";
import { LargeMovieCarousel } from "@/components/home/LargeMovieCarousel";
import { ScrollingCollectionList } from "@/components/home/ScrollingCollectionList";
import { Loader } from "@/components/Loader";
import { MediaListSection } from "@/components/medialists/MediaListSection";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { Ionicons } from "@expo/vector-icons";
import { Api } from "@jellyfin/sdk";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import {
  getItemsApi,
  getSuggestionsApi,
  getTvShowsApi,
  getUserLibraryApi,
  getUserViewsApi,
} from "@jellyfin/sdk/lib/utils/api";
import NetInfo from "@react-native-community/netinfo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BaseSection = {
  title: string;
  queryKey: (string | undefined)[];
};

type ScrollingCollectionListSection = BaseSection & {
  type: "ScrollingCollectionList";
  queryFn: () => Promise<BaseItemDto[]>;
  orientation?: "horizontal" | "vertical";
};

type MediaListSection = BaseSection & {
  type: "MediaListSection";
  queryFn: () => Promise<BaseItemDto>;
};

type Section = ScrollingCollectionListSection | MediaListSection;

export default function index() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const router = useRouter();

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [loading, setLoading] = useState(false);
  const [settings, _] = useSettings();

  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loadingRetry, setLoadingRetry] = useState(false);

  const checkConnection = useCallback(async () => {
    setLoadingRetry(true);
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected);
    setLoadingRetry(false);
  }, []);

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

  const {
    data: userViews,
    isError: e1,
    isLoading: l1,
  } = useQuery({
    queryKey: ["userViews", user?.Id],
    queryFn: async () => {
      if (!api || !user?.Id) {
        return null;
      }

      const response = await getUserViewsApi(api).getUserViews({
        userId: user.Id,
      });

      return response.data.Items || null;
    },
    enabled: !!api && !!user?.Id,
    staleTime: 60 * 1000,
  });

  const {
    data: mediaListCollections,
    isError: e2,
    isLoading: l2,
  } = useQuery({
    queryKey: ["sf_promoted", user?.Id, settings?.usePopularPlugin],
    queryFn: async () => {
      if (!api || !user?.Id) return [];

      const response = await getItemsApi(api).getItems({
        userId: user.Id,
        tags: ["sf_promoted"],
        recursive: true,
        fields: ["Tags"],
        includeItemTypes: ["BoxSet"],
      });

      return response.data.Items || [];
    },
    enabled: !!api && !!user?.Id && settings?.usePopularPlugin === true,
    staleTime: 60 * 1000,
  });

  const movieCollectionId = useMemo(() => {
    return userViews?.find((c) => c.CollectionType === "movies")?.Id;
  }, [userViews]);

  const tvShowCollectionId = useMemo(() => {
    return userViews?.find((c) => c.CollectionType === "tvshows")?.Id;
  }, [userViews]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await queryClient.refetchQueries({ queryKey: ["userViews"] });
    await queryClient.refetchQueries({ queryKey: ["resumeItems"] });
    await queryClient.refetchQueries({ queryKey: ["nextUp-all"] });
    await queryClient.refetchQueries({ queryKey: ["recentlyAddedInMovies"] });
    await queryClient.refetchQueries({ queryKey: ["recentlyAddedInTVShows"] });
    await queryClient.refetchQueries({ queryKey: ["suggestions"] });
    await queryClient.refetchQueries({
      queryKey: ["sf_promoted"],
    });
    await queryClient.refetchQueries({
      queryKey: ["sf_carousel"],
    });
    setLoading(false);
  }, [queryClient, user?.Id]);

  const sections = useMemo(() => {
    if (!api || !user?.Id) return [];

    const ss: Section[] = [
      // {
      //   title: "Continue Watching",
      //   queryKey: ["resumeItems", user.Id],
      //   queryFn: async () =>
      //     (
      //       await getItemsApi(api).getResumeItems({
      //         userId: user.Id,
      //         enableImageTypes: ["Primary", "Backdrop", "Thumb"],
      //       })
      //     ).data.Items || [],
      //   type: "ScrollingCollectionList",
      //   orientation: "horizontal",
      // },
      // {
      //   title: "Next Up",
      //   queryKey: ["nextUp-all", user?.Id],
      //   queryFn: async () =>
      //     (
      //       await getTvShowsApi(api).getNextUp({
      //         userId: user?.Id,
      //         fields: ["MediaSourceCount"],
      //         limit: 20,
      //         enableImageTypes: ["Primary", "Backdrop", "Thumb"],
      //       })
      //     ).data.Items || [],
      //   type: "ScrollingCollectionList",
      //   orientation: "horizontal",
      // },
      {
        title: t("home.recentlyAddedMovies"),
        queryKey: ["recentlyAddedInMovies", user?.Id, movieCollectionId],
        queryFn: async () =>
          (
            await getUserLibraryApi(api).getLatestMedia({
              userId: user?.Id,
              limit: 50,
              fields: ["PrimaryImageAspectRatio", "Path"],
              imageTypeLimit: 1,
              enableImageTypes: ["Primary", "Backdrop", "Thumb"],
              includeItemTypes: ["Movie"],
              parentId: movieCollectionId,
            })
          ).data || [],
        type: "ScrollingCollectionList",
      },
      {
        title: t("home.recentlyAddedTVShows"),
        queryKey: ["recentlyAddedInTVShows", user?.Id, tvShowCollectionId],
        queryFn: async () =>
          (
            await getUserLibraryApi(api).getLatestMedia({
              userId: user?.Id,
              limit: 50,
              fields: ["PrimaryImageAspectRatio", "Path"],
              imageTypeLimit: 1,
              enableImageTypes: ["Primary", "Backdrop", "Thumb"],
              includeItemTypes: ["Series"],
              parentId: tvShowCollectionId,
            })
          ).data || [],
        type: "ScrollingCollectionList",
      },
      ...(mediaListCollections?.map(
        (ml) =>
          ({
            title: ml.Name || "",
            queryKey: ["mediaList", ml.Id],
            queryFn: async () => ml,
            type: "MediaListSection",
          } as MediaListSection)
      ) || []),
      {
        title: t("home.suggestedMovies"),
        queryKey: ["suggestedMovies", user?.Id],
        queryFn: async () =>
          (
            await getSuggestionsApi(api).getSuggestions({
              userId: user?.Id,
              limit: 10,
              mediaType: ["Video"],
              type: ["Movie"],
            })
          ).data.Items || [],
        type: "ScrollingCollectionList",
        orientation: "vertical",
      },
      {
        title: t("home.suggestedEpisodes"),
        queryKey: ["suggestedEpisodes", user?.Id],
        queryFn: async () => {
          try {
            const suggestions = await getSuggestions(api, user.Id);
            const nextUpPromises = suggestions.map((series) =>
              getNextUp(api, user.Id, series.Id)
            );
            const nextUpResults = await Promise.all(nextUpPromises);

            return nextUpResults.filter((item) => item !== null) || [];
          } catch (error) {
            console.error("Error fetching data:", error);
            return [];
          }
        },
        type: "ScrollingCollectionList",
        orientation: "horizontal",
      },
    ];
    return ss;
  }, [
    api,
    user?.Id,
    movieCollectionId,
    tvShowCollectionId,
    mediaListCollections,
  ]);

  if (isConnected === false) {
    return (
      <View className="flex flex-col items-center justify-center h-full -mt-6 px-8">
        <Text className="text-3xl font-bold mb-2">{t("home.noInternet")}</Text>
        <Text className="text-center opacity-70">
          {t("home.noInternetMessage")}
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
            {t("home.goToDownloads")}
          </Button>
          <Button
            color="black"
            onPress={() => {
              checkConnection();
            }}
            justify="center"
            className="mt-2"
            iconRight={
              loadingRetry ? null : (
                <Ionicons name="refresh" size={20} color="white" />
              )
            }
          >
            {loadingRetry ? (
              <ActivityIndicator size={"small"} color={"white"} />
            ) : (
              "Retry"
            )}
          </Button>
        </View>
      </View>
    );
  }

  const insets = useSafeAreaInsets();

  if (e1 || e2 || !api)
    return (
      <View className="flex flex-col items-center justify-center h-full -mt-6">
        <Text className="text-3xl font-bold mb-2">{t("home.oops")}</Text>
        <Text className="text-center opacity-70">{t("home.errorMessage")}</Text>
      </View>
    );

  if (l1 || l2)
    return (
      <View className="justify-center items-center h-full">
        <Loader />
      </View>
    );

  return (
    <ScrollView
      nestedScrollEnabled
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refetch} />
      }
      key={"home"}
      contentContainerStyle={{
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
      className="flex flex-col space-y-4 mb-20"
    >
      <LargeMovieCarousel />

      <ScrollingCollectionList
        key="nextUp"
        title={t("home.nextUp")}
        queryKey={["nextUp-all", user?.Id]}
        queryFn={async () =>
          (
            await getTvShowsApi(api).getNextUp({
              userId: user?.Id,
              fields: ["MediaSourceCount"],
              limit: 20,
              enableImageTypes: ["Primary", "Backdrop", "Thumb"],
            })
          ).data.Items|| []
        }
        orientation={"horizontal"}
      />

      <ScrollingCollectionList
        key="continueWatching"
        title={t("home.continueWatching")}
        queryKey={["continueWatching", user?.Id]}
        queryFn={async () =>
          (
            await getItemsApi(api).getResumeItems({
              userId: user?.Id,
              enableImageTypes: ["Primary", "Backdrop", "Thumb"],
            })
          ).data.Items || []
        }
        orientation={"horizontal"}
      />

      {sections.map((section, index) => {
        if (section.type === "ScrollingCollectionList") {
          return (
            <ScrollingCollectionList
              key={index}
              title={section.title}
              queryKey={section.queryKey}
              queryFn={section.queryFn}
              orientation={section.orientation}
            />
          );
        } else if (section.type === "MediaListSection") {
          return (
            <MediaListSection
              key={index}
              queryKey={section.queryKey}
              queryFn={section.queryFn}
            />
          );
        }
        return null;
      })}
    </ScrollView>
  );
}

// Function to get suggestions
async function getSuggestions(api: Api, userId: string | undefined) {
  if (!userId) return [];
  const response = await getSuggestionsApi(api).getSuggestions({
    userId,
    limit: 10,
    mediaType: ["Unknown"],
    type: ["Series"],
  });
  return response.data.Items ?? [];
}

// Function to get the next up TV show for a series
async function getNextUp(
  api: Api,
  userId: string | undefined,
  seriesId: string | undefined
) {
  if (!userId || !seriesId) return null;
  const response = await getTvShowsApi(api).getNextUp({
    userId,
    seriesId,
    limit: 1,
  });
  return response.data.Items?.[0] ?? null;
}
