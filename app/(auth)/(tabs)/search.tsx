import { HorizontalScroll } from "@/components/common/HorrizontalScroll";
import { Input } from "@/components/common/Input";
import { Text } from "@/components/common/Text";
import ContinueWatchingPoster from "@/components/ContinueWatchingPoster";
import { ItemCardText } from "@/components/ItemCardText";
import MoviePoster from "@/components/MoviePoster";
import Poster from "@/components/Poster";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { getPrimaryImageUrl } from "@/utils/jellyfin/image/getPrimaryImageUrl";
import { getUserItemData } from "@/utils/jellyfin/user-library/getUserItemData";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getSearchApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

export default function search() {
  const [search, setSearch] = useState<string>("");

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const { data: movies } = useQuery({
    queryKey: ["search-movies", search],
    queryFn: async () => {
      if (!api || !user || search.length === 0) return [];

      const searchApi = await getSearchApi(api).getSearchHints({
        searchTerm: search,
        limit: 10,
        includeItemTypes: ["Movie"],
      });

      return searchApi.data.SearchHints;
    },
  });

  const { data: series } = useQuery({
    queryKey: ["search-series", search],
    queryFn: async () => {
      if (!api || !user || search.length === 0) return [];

      const searchApi = await getSearchApi(api).getSearchHints({
        searchTerm: search,
        limit: 10,
        includeItemTypes: ["Series"],
      });

      return searchApi.data.SearchHints;
    },
  });
  const { data: episodes } = useQuery({
    queryKey: ["search-episodes", search],
    queryFn: async () => {
      if (!api || !user || search.length === 0) return [];

      const searchApi = await getSearchApi(api).getSearchHints({
        searchTerm: search,
        limit: 10,
        includeItemTypes: ["Episode"],
      });

      return searchApi.data.SearchHints;
    },
  });

  return (
    <ScrollView keyboardDismissMode="on-drag">
      <View className="flex flex-col pt-2 pb-20">
        <View className="mb-4 px-4">
          <Input
            autoCorrect={false}
            returnKeyType="done"
            keyboardType="web-search"
            placeholder="Search here..."
            value={search}
            onChangeText={(text) => setSearch(text)}
          />
        </View>

        <Text className="font-bold text-2xl px-4 mb-2">Movies</Text>
        <SearchItemWrapper
          ids={movies?.map((m) => m.Id!)}
          renderItem={(data) => (
            <HorizontalScroll<BaseItemDto>
              data={data}
              renderItem={(item) => (
                <TouchableOpacity
                  key={item.Id}
                  className="flex flex-col w-32"
                  onPress={() => router.push(`/items/${item.Id}/page`)}
                >
                  <MoviePoster item={item} key={item.Id} />
                  <Text className="mt-2">{item.Name}</Text>
                  <Text className="opacity-50 text-xs">
                    {item.ProductionYear}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        />
        <Text className="font-bold text-2xl px-4 my-2">Series</Text>
        <SearchItemWrapper
          ids={series?.map((m) => m.Id!)}
          renderItem={(data) => (
            <HorizontalScroll<BaseItemDto>
              data={data}
              renderItem={(item) => (
                <TouchableOpacity
                  key={item.Id}
                  onPress={() => router.push(`/series/${item.Id}/page`)}
                  className="flex flex-col w-32"
                >
                  <Poster
                    item={item}
                    key={item.Id}
                    url={getPrimaryImageUrl({ api, item })}
                  />
                  <Text className="mt-2">{item.Name}</Text>
                  <Text className="opacity-50 text-xs">
                    {item.ProductionYear}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        />
        <Text className="font-bold text-2xl px-4 my-2">Episodes</Text>
        <SearchItemWrapper
          ids={episodes?.map((m) => m.Id!)}
          renderItem={(data) => (
            <HorizontalScroll<BaseItemDto>
              data={data}
              renderItem={(item) => (
                <TouchableOpacity
                  key={item.Id}
                  onPress={() => router.push(`/items/${item.Id}/page`)}
                  className="flex flex-col w-48"
                >
                  <ContinueWatchingPoster item={item} />
                  <ItemCardText item={item} />
                </TouchableOpacity>
              )}
            />
          )}
        />
      </View>
    </ScrollView>
  );
}

type Props = {
  ids?: string[] | null;
  renderItem: (data: BaseItemDto[]) => React.ReactNode;
};

const SearchItemWrapper: React.FC<Props> = ({ ids, renderItem }) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const { data, isLoading: l1 } = useQuery({
    queryKey: ["items", ids],
    queryFn: async () => {
      if (!user?.Id || !api || !ids || ids.length === 0) {
        return [];
      }

      const itemPromises = ids.map((id) =>
        getUserItemData({
          api,
          userId: user.Id,
          itemId: id,
        }),
      );

      const results = await Promise.all(itemPromises);

      // Filter out null items
      return results.filter(
        (item) => item !== null,
      ) as unknown as BaseItemDto[];
    },
    enabled: !!ids && ids.length > 0 && !!api && !!user?.Id,
    staleTime: Infinity,
  });

  if (!data) return <Text className="opacity-50 text-xs px-4">No results</Text>;

  return renderItem(data);
};
