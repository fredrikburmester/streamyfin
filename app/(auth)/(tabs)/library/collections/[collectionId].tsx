import { ColumnItem } from "@/components/common/ColumnItem";
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
import { getFilterApi, getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import React, { useCallback, useMemo } from "react";
import { ScrollView, View } from "react-native";

const page: React.FC = () => {
  const searchParams = useLocalSearchParams();
  const { collectionId } = searchParams as { collectionId: string };

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [selectedGenres, setSelectedGenres] = useAtom(genreFilterAtom);
  const [selectedYears, setSelectedYears] = useAtom(yearFilterAtom);
  const [selectedTags, setSelectedTags] = useAtom(tagsFilterAtom);
  const [sortBy, setSortBy] = useAtom(sortByAtom);
  const [sortOrder, setSortOrder] = useAtom(sortOrderAtom);

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

      const includeItemTypes: BaseItemKind[] = [];

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
      collectionId,
      collection?.CollectionType,
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
      collection,
      selectedGenres,
      selectedYears,
      selectedTags,
      sortBy,
      sortOrder,
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
            <ScrollView horizontal>
              <View className="flex flex-row space-x-1">
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
        }
      />
    </>
  );
};

export default page;
