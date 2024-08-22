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
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NativeScrollEvent, ScrollView, View } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";

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
  const { libraryId } = searchParams as { libraryId: string };

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);
  const navigation = useNavigation();

  const [selectedGenres, setSelectedGenres] = useAtom(genreFilterAtom);
  const [selectedYears, setSelectedYears] = useAtom(yearFilterAtom);
  const [selectedTags, setSelectedTags] = useAtom(tagsFilterAtom);
  const [sortBy, setSortBy] = useAtom(sortByAtom);
  const [sortOrder, setSortOrder] = useAtom(sortOrderAtom);

  const [orientation, setOrientation] = useState(
    ScreenOrientation.Orientation.PORTRAIT_UP
  );

  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        setOrientation(event.orientationInfo.orientation);
      }
    );

    // Set the initial orientation
    ScreenOrientation.getOrientationAsync().then((initialOrientation) => {
      setOrientation(initialOrientation);
    });

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, [ScreenOrientation]);

  const { data: library } = useQuery({
    queryKey: ["library", libraryId],
    queryFn: async () => {
      if (!api) return null;
      const response = await getUserLibraryApi(api).getItem({
        itemId: libraryId,
        userId: user?.Id,
      });
      const data = response.data;
      return data;
    },
    enabled: !!api && !!user?.Id && !!libraryId,
    staleTime: 0,
  });

  const fetchItems = useCallback(
    async ({
      pageParam,
    }: {
      pageParam: number;
    }): Promise<BaseItemDtoQueryResult | null> => {
      if (!api || !library) return null;

      const includeItemTypes: BaseItemKind[] = [];

      switch (library?.CollectionType) {
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
          includeItemTypes.push("Movie");
          includeItemTypes.push("Series");
          break;
      }

      const response = await getItemsApi(api).getItems({
        userId: user?.Id,
        parentId: libraryId,
        limit: 66,
        startIndex: pageParam,
        sortBy: [sortBy[0].key, "SortName", "ProductionYear"],
        sortOrder: [sortOrder[0].key],
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
      libraryId,
      library,
      selectedGenres,
      selectedYears,
      selectedTags,
      sortBy,
      sortOrder,
    ]
  );

  const { data, isFetching, fetchNextPage } = useInfiniteQuery({
    queryKey: [
      "library-items",
      libraryId,
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
    enabled: !!api && !!user?.Id && !!library,
  });

  const flatData = useMemo(() => {
    return data?.pages.flatMap((p) => p?.Items) || [];
  }, [data]);

  if (!library) return null;

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
                collectionId={libraryId}
                queryKey="genreFilter"
                queryFn={async () => {
                  if (!api) return null;
                  const response = await getFilterApi(
                    api
                  ).getQueryFiltersLegacy({
                    userId: user?.Id,
                    parentId: libraryId,
                  });
                  console.log("Resukt:", response.data.Genres || "Nothing...");
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
                collectionId={libraryId}
                queryKey="tagsFilter"
                queryFn={async () => {
                  if (!api) return null;
                  const response = await getFilterApi(
                    api
                  ).getQueryFiltersLegacy({
                    userId: user?.Id,
                    parentId: libraryId,
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
                collectionId={libraryId}
                queryKey="yearFilter"
                queryFn={async () => {
                  if (!api) return null;
                  const response = await getFilterApi(
                    api
                  ).getQueryFiltersLegacy({
                    userId: user?.Id,
                    parentId: libraryId,
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
                collectionId={libraryId}
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
                collectionId={libraryId}
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
          {isFetching && (
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
                  key={`${item.Id}-${index}`}
                  style={{
                    width:
                      orientation === ScreenOrientation.Orientation.PORTRAIT_UP
                        ? "32%"
                        : "20%",
                    marginBottom:
                      orientation === ScreenOrientation.Orientation.PORTRAIT_UP
                        ? 4
                        : 16,
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
                width:
                  orientation === ScreenOrientation.Orientation.PORTRAIT_UP
                    ? "32%"
                    : "20%",
              }}
            ></View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default page;
