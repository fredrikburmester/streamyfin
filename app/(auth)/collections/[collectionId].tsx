import { Text } from "@/components/common/Text";
import { TouchableItemRouter } from "@/components/common/TouchableItemRouter";
import { FilterButton } from "@/components/filters/FilterButton";
import { ResetFiltersButton } from "@/components/filters/ResetFiltersButton";
import { ItemCardText } from "@/components/ItemCardText";
import { Loader } from "@/components/Loader";
import MoviePoster from "@/components/posters/MoviePoster";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import {
  genreFilterAtom,
  sortByAtom,
  sortOptions,
  sortOrderAtom,
  sortOrderOptions,
  tagsFilterAtom,
  yearFilterAtom,
} from "@/utils/atoms/filters";
import {
  BaseItemDtoQueryResult,
  BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client/models";
import {
  getFilterApi,
  getItemsApi,
  getUserLibraryApi,
} from "@jellyfin/sdk/lib/utils/api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { useAtom } from "jotai";
import React, { useCallback, useEffect, useMemo } from "react";
import { NativeScrollEvent, ScrollView, View } from "react-native";

const isCloseToBottom = ({
  layoutMeasurement,
  contentOffset,
  contentSize,
}: NativeScrollEvent) => {
  const paddingToBottom = 200;
  return (
    layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom
  );
};

const page: React.FC = () => {
  const searchParams = useLocalSearchParams();
  const { collectionId } = searchParams as { collectionId: string };

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const navigation = useNavigation();

  const [selectedGenres, setSelectedGenres] = useAtom(genreFilterAtom);
  const [selectedYears, setSelectedYears] = useAtom(yearFilterAtom);
  const [selectedTags, setSelectedTags] = useAtom(tagsFilterAtom);
  const [sortBy, setSortBy] = useAtom(sortByAtom);
  const [sortOrder, setSortOrder] = useAtom(sortOrderAtom);

  useEffect(() => {
    setSortBy([
      {
        key: "ProductionYear",
        value: "Production Year",
      },
    ]);
    setSortOrder([
      {
        key: "Descending",
        value: "Descending",
      },
    ]);
  }, []);

  const { data: collection } = useQuery({
    queryKey: ["collection", collectionId],
    queryFn: async () => {
      if (!api) return null;
      const response = await getUserLibraryApi(api).getItem({
        itemId: collectionId,
        userId: user?.Id,
      });
      const data = response.data;
      return data;
    },
    enabled: !!api && !!user?.Id && !!collectionId,
    staleTime: 0,
  });

  useEffect(() => {
    navigation.setOptions({ title: collection?.Name || "" });
  }, [navigation, collection]);

  const fetchItems = useCallback(
    async ({
      pageParam,
    }: {
      pageParam: number;
    }): Promise<BaseItemDtoQueryResult | null> => {
      if (!api || !collection) return null;

      const response = await getItemsApi(api).getItems({
        userId: user?.Id,
        parentId: collectionId,
        limit: 18,
        startIndex: pageParam,
        sortBy: [sortBy[0].key, "SortName", "ProductionYear"],
        sortOrder: [sortOrder[0].key],
        fields: [
          "ItemCounts",
          "PrimaryImageAspectRatio",
          "CanDelete",
          "MediaSourceCount",
        ],
        genres: selectedGenres,
        tags: selectedTags,
        years: selectedYears.map((year) => parseInt(year)),
      });

      return response.data || null;
    },
    [
      api,
      user?.Id,
      collection,
      selectedGenres,
      selectedYears,
      selectedTags,
      sortBy,
      sortOrder,
    ]
  );

  const { data, isFetching, fetchNextPage } = useInfiniteQuery({
    queryKey: [
      "collection-items",
      collection,
      selectedGenres,
      selectedYears,
      selectedTags,
      sortBy,
      sortOrder,
    ],
    queryFn: fetchItems,
    getNextPageParam: (lastPage, pages) => {
      if (
        !lastPage?.Items ||
        !lastPage?.TotalRecordCount ||
        lastPage?.TotalRecordCount === 0
      )
        return undefined;

      const totalItems = lastPage.TotalRecordCount;
      const accumulatedItems = pages.reduce(
        (acc, curr) => acc + (curr?.Items?.length || 0),
        0
      );

      if (accumulatedItems < totalItems) {
        return lastPage?.Items?.length * pages.length;
      } else {
        return undefined;
      }
    },
    initialPageParam: 0,
    enabled: !!api && !!user?.Id && !!collection,
  });

  useEffect(() => {
    console.log("Data: ", data);
  }, [data]);

  const type = useMemo(() => {
    return data?.pages.flatMap((page) => page?.Items)[0]?.Type || null;
  }, [data]);

  const flatData = useMemo(() => {
    return data?.pages.flatMap((p) => p?.Items) || [];
  }, [data]);

  if (!collection) return null;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      onScroll={({ nativeEvent }) => {
        if (isCloseToBottom(nativeEvent)) {
          fetchNextPage();
        }
      }}
      scrollEventThrottle={400}
    >
      <View className="mt-4 mb-24">
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex flex-row space-x-1 px-3">
              <ResetFiltersButton />
              <FilterButton
                collectionId={collectionId}
                queryKey="genreFilter"
                queryFn={async () => {
                  if (!api) return null;
                  const response = await getFilterApi(
                    api
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
                renderItemLabel={(item) => item.toString()}
                searchFilter={(item, search) =>
                  item.toLowerCase().includes(search.toLowerCase())
                }
              />
              <FilterButton
                collectionId={collectionId}
                queryKey="tagsFilter"
                queryFn={async () => {
                  if (!api) return null;
                  const response = await getFilterApi(
                    api
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
                renderItemLabel={(item) => item.toString()}
                searchFilter={(item, search) =>
                  item.toLowerCase().includes(search.toLowerCase())
                }
              />
              <FilterButton
                collectionId={collectionId}
                queryKey="yearFilter"
                queryFn={async () => {
                  if (!api) return null;
                  const response = await getFilterApi(
                    api
                  ).getQueryFiltersLegacy({
                    userId: user?.Id,
                    includeItemTypes: type ? [type] : [],
                    parentId: collectionId,
                  });
                  return (
                    response.data.Years?.sort((a, b) => b - a).map((y) =>
                      y.toString()
                    ) || []
                  );
                }}
                set={setSelectedYears}
                values={selectedYears}
                title="Years"
                renderItemLabel={(item) => item.toString()}
                searchFilter={(item, search) =>
                  item.toLowerCase().includes(search.toLowerCase())
                }
              />
              <FilterButton
                icon="sort"
                collectionId={collectionId}
                queryKey="sortByFilter"
                queryFn={async () => {
                  return sortOptions;
                }}
                set={setSortBy}
                values={sortBy}
                title="Sort by"
                renderItemLabel={(item) => item.value}
                searchFilter={(item, search) =>
                  item.value.toLowerCase().includes(search.toLowerCase()) ||
                  item.value.toLowerCase().includes(search.toLowerCase())
                }
                showSearch={false}
              />
              <FilterButton
                icon="sort"
                showSearch={false}
                collectionId={collectionId}
                queryKey="orderByFilter"
                queryFn={async () => {
                  return sortOrderOptions;
                }}
                set={setSortOrder}
                values={sortOrder}
                title="Order by"
                renderItemLabel={(item) => item.value}
                searchFilter={(item, search) =>
                  item.value.toLowerCase().includes(search.toLowerCase()) ||
                  item.value.toLowerCase().includes(search.toLowerCase())
                }
              />
            </View>
          </ScrollView>
          {!type && isFetching && (
            <Loader
              style={{
                marginTop: 300,
              }}
            />
          )}
        </View>
        <View className="flex flex-row flex-wrap px-4 justify-between after:content-['']">
          {flatData.map(
            (item, index) =>
              item && (
                <TouchableItemRouter
                  key={`${item.Id}`}
                  style={{
                    width: "32%",
                    marginBottom: 4,
                  }}
                  item={item}
                  className={`
                    `}
                >
                  <MoviePoster item={item} />
                  <ItemCardText item={item} />
                </TouchableItemRouter>
              )
          )}
          {flatData.length % 3 !== 0 && (
            <View
              style={{
                width: "33%",
              }}
            ></View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default page;
