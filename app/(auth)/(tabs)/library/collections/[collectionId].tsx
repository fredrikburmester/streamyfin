import * as DropdownMenu from "zeego/dropdown-menu";
import ArtistPoster from "@/components/ArtistPoster";
import { ColumnItem } from "@/components/common/ColumnItem";
import { Text } from "@/components/common/Text";
import { ItemCardText } from "@/components/ItemCardText";
import { Loading } from "@/components/Loading";
import MoviePoster from "@/components/MoviePoster";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { Ionicons } from "@expo/vector-icons";
import {
  BaseItemDto,
  BaseItemDtoQueryResult,
  BaseItemKind,
  ItemSortBy,
  NameGuidPair,
} from "@jellyfin/sdk/lib/generated-client/models";
import { getFilterApi, getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { FlashList } from "@shopify/flash-list";
import {
  QueryFilters,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Stack,
  router,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { useAtom } from "jotai";
import React, {
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
  ViewProps,
} from "react-native";
import {
  genreFilterAtom,
  yearFilterAtom,
  sortByAtom,
  tagsFilterAtom,
} from "@/utils/atoms/filters";
import { ResetFiltersButton } from "@/components/filters/ResetFiltersButton";
import { FilterButton } from "@/components/filters/FilterButton";
import { TouchableItemRouter } from "@/components/common/TouchableItemRouter";

const page: React.FC = () => {
  const searchParams = useLocalSearchParams();
  const navigation = useNavigation();
  const { collectionId } = searchParams as { collectionId: string };

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [selectedGenres, setSelectedGenres] = useAtom(genreFilterAtom);
  const [selectedYears, setSelectedYears] = useAtom(yearFilterAtom);
  const [selectedTags, setSelectedTags] = useAtom(tagsFilterAtom);
  const [sortBy, setSortBy] = useAtom(sortByAtom);

  const { data: collection } = useQuery({
    queryKey: ["collection", collectionId],
    queryFn: async () => {
      if (!api) return null;
      const response = await getItemsApi(api).getItems({
        userId: user?.Id,
        ids: [collectionId],
      });
      const data = response.data.Items?.[0];
      return data;
    },
    enabled: !!api && !!user?.Id && !!collectionId,
    staleTime: 0,
  });

  const fetchItems = useCallback(
    async ({
      pageParam,
    }: {
      pageParam: number;
    }): Promise<BaseItemDtoQueryResult | null> => {
      if (!api || !collection) return null;

      const sortBy: ItemSortBy[] = [];
      const includeItemTypes: BaseItemKind[] = [];

      switch (collection?.CollectionType) {
        case "movies":
          sortBy.push("SortName", "ProductionYear");
          break;
        case "boxsets":
          sortBy.push("IsFolder", "SortName");
          break;
        default:
          sortBy.push("SortName");
          break;
      }

      switch (collection?.CollectionType) {
        case "movies":
          includeItemTypes.push("Movie");
          break;
        case "boxsets":
          includeItemTypes.push("BoxSet");
          break;
        case "tvshows":
          includeItemTypes.push("Series");
          break;
        case "music":
          includeItemTypes.push("MusicAlbum");
          break;
        default:
          break;
      }

      const response = await getItemsApi(api).getItems({
        userId: user?.Id,
        parentId: collectionId,
        limit: 50,
        startIndex: pageParam,
        sortBy,
        sortOrder: ["Ascending"],
        includeItemTypes,
        enableImageTypes: ["Primary", "Backdrop", "Banner", "Thumb"],
        recursive: true,
        imageTypeLimit: 1,
        fields: ["PrimaryImageAspectRatio", "SortName"],
        genres: selectedGenres,
        tags: selectedTags,
        years: selectedYears.map((year) => parseInt(year)),
      });

      return response.data || null;
    },
    [
      api,
      user?.Id,
      collectionId,
      collection?.CollectionType,
      selectedGenres,
      selectedYears,
      selectedTags,
    ],
  );

  const {
    status,
    data,
    error,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    hasPreviousPage,
  } = useInfiniteQuery({
    queryKey: [
      "library-items",
      collection,
      selectedGenres,
      selectedYears,
      selectedTags,
      sortBy,
    ],
    queryFn: fetchItems,
    getNextPageParam: (lastPage, pages) => {
      const totalItems = lastPage?.TotalRecordCount || 0;
      if ((lastPage?.Items?.length || 0) < totalItems) {
        return lastPage?.Items?.length;
      } else {
        return undefined;
      }
    },
    initialPageParam: 0,
    enabled: !!api && !!user?.Id && !!collection,
  });

  const type = useMemo(() => {
    return data?.pages.flatMap((page) => page?.Items)[0]?.Type || null;
  }, [data]);

  if (!collection || !collection.CollectionType) return null;

  return (
    <>
      <FlashList
        refreshing={isFetching}
        data={data?.pages.flatMap((page) => page?.Items) || []}
        horizontal={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingTop: 17,
          paddingHorizontal: 10,
          paddingBottom: 150,
        }}
        onEndReached={fetchNextPage}
        onEndReachedThreshold={0.5}
        renderItem={({ item, index }) =>
          item ? (
            <ColumnItem index={index} numColumns={3} style={{}}>
              <TouchableItemRouter
                style={{
                  width: "100%",
                  padding: 4,
                }}
                item={item}
              >
                <MoviePoster item={item} />
                <ItemCardText item={item} />
              </TouchableItemRouter>
            </ColumnItem>
          ) : null
        }
        numColumns={3}
        estimatedItemSize={200}
        ListHeaderComponent={
          <View className="mb-4">
            <View className="flex flex-row space-x-1">
              <ResetFiltersButton />
              <FilterButton
                collectionId={collectionId}
                queryKey="genreFilter"
                queryFn={async () => {
                  if (!api) return null;
                  const response = await getFilterApi(
                    api,
                  ).getQueryFiltersLegacy({
                    userId: user?.Id,
                    includeItemTypes: type ? [type] : [],
                    parentId: collectionId,
                  });
                  return response.data.Genres || [];
                }}
                set={setSelectedGenres}
                values={selectedGenres}
                title="Genres"
              />
              <FilterButton
                collectionId={collectionId}
                queryKey="tagsFilter"
                queryFn={async () => {
                  if (!api) return null;
                  const response = await getFilterApi(
                    api,
                  ).getQueryFiltersLegacy({
                    userId: user?.Id,
                    includeItemTypes: type ? [type] : [],
                    parentId: collectionId,
                  });
                  return response.data.Tags || [];
                }}
                set={setSelectedTags}
                values={selectedTags}
                title="Tags"
              />
              <FilterButton
                collectionId={collectionId}
                queryKey="yearFilter"
                queryFn={async () => {
                  if (!api) return null;
                  const response = await getFilterApi(
                    api,
                  ).getQueryFiltersLegacy({
                    userId: user?.Id,
                    includeItemTypes: type ? [type] : [],
                    parentId: collectionId,
                  });
                  return (
                    response.data.Years?.sort((a, b) => b - a).map((y) =>
                      y.toString(),
                    ) || []
                  );
                }}
                set={setSelectedYears}
                values={selectedYears}
                title="Years"
              />
            </View>
            {!type && isFetching && (
              <ActivityIndicator
                style={{
                  marginTop: 300,
                }}
                size={"small"}
                color={"white"}
              />
            )}
          </View>
        }
      />
    </>
  );
};

export default page;
