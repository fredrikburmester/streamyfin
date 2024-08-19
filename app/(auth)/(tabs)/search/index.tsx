import { Button } from "@/components/Button";
import { HorizontalScroll } from "@/components/common/HorrizontalScroll";
import { Input } from "@/components/common/Input";
import { Text } from "@/components/common/Text";
import { TouchableItemRouter } from "@/components/common/TouchableItemRouter";
import ContinueWatchingPoster from "@/components/ContinueWatchingPoster";
import { ItemCardText } from "@/components/ItemCardText";
import { Loader } from "@/components/Loader";
import AlbumCover from "@/components/posters/AlbumCover";
import MoviePoster from "@/components/posters/MoviePoster";
import SeriesPoster from "@/components/posters/SeriesPoster";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { useSettings } from "@/utils/atoms/settings";
import { getUserItemData } from "@/utils/jellyfin/user-library/getUserItemData";
import { Ionicons } from "@expo/vector-icons";
import { Api } from "@jellyfin/sdk";
import {
  BaseItemDto,
  BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client/models";
import { getItemsApi, getSearchApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Href,
  router,
  useLocalSearchParams,
  useNavigation,
  usePathname,
} from "expo-router";
import { useAtom } from "jotai";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Platform, ScrollView, TouchableOpacity, View } from "react-native";
import { useDebounce } from "use-debounce";

const exampleSearches = [
  "Lord of the rings",
  "Avengers",
  "Game of Thrones",
  "Breaking Bad",
  "Stranger Things",
  "The Mandalorian",
];

export default function search() {
  const params = useLocalSearchParams();

  const { q, prev } = params as { q: string; prev: Href<string> };

  const [search, setSearch] = useState<string>("");

  const [debouncedSearch] = useDebounce(search, 500);

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const [settings] = useSettings();

  const searchEngine = useMemo(() => {
    return settings?.searchEngine || "Jellyfin";
  }, [settings]);

  useEffect(() => {
    if (q && q.length > 0) setSearch(q);
  }, [q]);

  const searchFn = useCallback(
    async ({
      types,
      query,
    }: {
      types: BaseItemKind[];
      query: string;
    }): Promise<BaseItemDto[]> => {
      if (!api) return [];

      if (searchEngine === "Jellyfin") {
        const searchApi = await getSearchApi(api).getSearchHints({
          searchTerm: query,
          limit: 10,
          includeItemTypes: types,
        });

        return searchApi.data.SearchHints as BaseItemDto[];
      } else {
        const url = `${settings?.marlinServerUrl}/search?q=${encodeURIComponent(
          query
        )}&includeItemTypes=${types
          .map((type) => encodeURIComponent(type))
          .join("&includeItemTypes=")}`;

        const response1 = await axios.get(url);
        const ids = response1.data.ids;

        if (!ids || !ids.length) return [];

        const response2 = await getItemsApi(api).getItems({
          ids,
          enableImageTypes: ["Primary", "Backdrop", "Thumb"],
        });

        return response2.data.Items as BaseItemDto[];
      }
    },
    [api, settings]
  );

  const navigation = useNavigation();
  useLayoutEffect(() => {
    if (Platform.OS === "ios")
      navigation.setOptions({
        headerSearchBarOptions: {
          placeholder: "Search...",
          onChangeText: (e: any) => {
            router.setParams({ q: "" });
            setSearch(e.nativeEvent.text);
          },
          hideWhenScrolling: false,
          autoFocus: true,
        },
      });
  }, [navigation]);

  const { data: movies, isFetching: l1 } = useQuery({
    queryKey: ["search", "movies", debouncedSearch],
    queryFn: () =>
      searchFn({
        query: debouncedSearch,
        types: ["Movie"],
      }),
    enabled: debouncedSearch.length > 0,
  });

  const { data: series, isFetching: l2 } = useQuery({
    queryKey: ["search", "series", debouncedSearch],
    queryFn: () =>
      searchFn({
        query: debouncedSearch,
        types: ["Series"],
      }),
    enabled: debouncedSearch.length > 0,
  });

  const { data: episodes, isFetching: l3 } = useQuery({
    queryKey: ["search", "episodes", debouncedSearch],
    queryFn: () =>
      searchFn({
        query: debouncedSearch,
        types: ["Episode"],
      }),
    enabled: debouncedSearch.length > 0,
  });

  const { data: artists, isFetching: l4 } = useQuery({
    queryKey: ["search", "artists", debouncedSearch],
    queryFn: () =>
      searchFn({
        query: debouncedSearch,
        types: ["MusicArtist"],
      }),
    enabled: debouncedSearch.length > 0,
  });

  const { data: albums, isFetching: l5 } = useQuery({
    queryKey: ["search", "albums", debouncedSearch],
    queryFn: () =>
      searchFn({
        query: debouncedSearch,
        types: ["MusicAlbum"],
      }),
    enabled: debouncedSearch.length > 0,
  });

  const { data: songs, isFetching: l6 } = useQuery({
    queryKey: ["search", "songs", debouncedSearch],
    queryFn: () =>
      searchFn({
        query: debouncedSearch,
        types: ["Audio"],
      }),
    enabled: debouncedSearch.length > 0,
  });

  const noResults = useMemo(() => {
    return !(
      artists?.length ||
      albums?.length ||
      songs?.length ||
      movies?.length ||
      episodes?.length ||
      series?.length
    );
  }, [artists, episodes, albums, songs, movies, series]);

  const loading = useMemo(() => {
    return l1 || l2 || l3 || l4 || l5 || l6;
  }, [l1, l2, l3, l4, l5, l6]);

  return (
    <>
      <ScrollView
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="flex flex-col pt-4 pb-32">
          {Platform.OS === "android" && (
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
          )}
          {!!q && (
            <View className="px-4 flex flex-col space-y-2">
              <Text className="text-neutral-500 ">
                Results for <Text className="text-purple-600">{q}</Text>
              </Text>
            </View>
          )}
          <SearchItemWrapper
            header="Movies"
            ids={movies?.map((m) => m.Id!)}
            renderItem={(data) => (
              <HorizontalScroll<BaseItemDto>
                data={data}
                renderItem={(item) => (
                  <TouchableOpacity
                    key={item.Id}
                    className="flex flex-col w-32"
                    onPress={() => router.push(`/items/${item.Id}`)}
                  >
                    <MoviePoster item={item} key={item.Id} />
                    <Text numberOfLines={2} className="mt-2">
                      {item.Name}
                    </Text>
                    <Text className="opacity-50 text-xs">
                      {item.ProductionYear}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          />
          <SearchItemWrapper
            ids={series?.map((m) => m.Id!)}
            header="Series"
            renderItem={(data) => (
              <HorizontalScroll<BaseItemDto>
                data={data}
                renderItem={(item) => (
                  <TouchableOpacity
                    key={item.Id}
                    onPress={() => router.push(`/series/${item.Id}`)}
                    className="flex flex-col w-32"
                  >
                    <SeriesPoster item={item} key={item.Id} />
                    <Text numberOfLines={2} className="mt-2">
                      {item.Name}
                    </Text>
                    <Text className="opacity-50 text-xs">
                      {item.ProductionYear}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          />
          <SearchItemWrapper
            ids={episodes?.map((m) => m.Id!)}
            header="Episodes"
            renderItem={(data) => (
              <HorizontalScroll<BaseItemDto>
                data={data}
                renderItem={(item) => (
                  <TouchableOpacity
                    key={item.Id}
                    onPress={() => router.push(`/items/${item.Id}`)}
                    className="flex flex-col w-48"
                  >
                    <ContinueWatchingPoster item={item} />
                    <ItemCardText item={item} />
                  </TouchableOpacity>
                )}
              />
            )}
          />
          <SearchItemWrapper
            ids={artists?.map((m) => m.Id!)}
            header="Artists"
            renderItem={(data) => (
              <HorizontalScroll<BaseItemDto>
                data={data}
                renderItem={(item) => (
                  <TouchableItemRouter
                    item={item}
                    key={item.Id}
                    className="flex flex-col w-32"
                  >
                    <AlbumCover id={item.Id} />
                    <ItemCardText item={item} />
                  </TouchableItemRouter>
                )}
              />
            )}
          />
          <SearchItemWrapper
            ids={albums?.map((m) => m.Id!)}
            header="Albums"
            renderItem={(data) => (
              <HorizontalScroll<BaseItemDto>
                data={data}
                renderItem={(item) => (
                  <TouchableItemRouter
                    item={item}
                    key={item.Id}
                    className="flex flex-col w-32"
                  >
                    <AlbumCover id={item.Id} />
                    <ItemCardText item={item} />
                  </TouchableItemRouter>
                )}
              />
            )}
          />
          <SearchItemWrapper
            ids={songs?.map((m) => m.Id!)}
            header="Songs"
            renderItem={(data) => (
              <HorizontalScroll<BaseItemDto>
                data={data}
                renderItem={(item) => (
                  <TouchableItemRouter
                    item={item}
                    key={item.Id}
                    className="flex flex-col w-32"
                  >
                    <AlbumCover id={item.AlbumId} />
                    <ItemCardText item={item} />
                  </TouchableItemRouter>
                )}
              />
            )}
          />
          {loading ? (
            <View className="mt-4 flex justify-center items-center">
              <Loader />
            </View>
          ) : noResults && debouncedSearch.length > 0 ? (
            <View>
              <Text className="text-center text-lg font-bold mt-4">
                No results found for
              </Text>
              <Text className="text-xs text-purple-600 text-center">
                "{debouncedSearch}"
              </Text>
            </View>
          ) : debouncedSearch.length === 0 ? (
            <View className="mt-4 flex flex-col items-center space-y-2">
              {exampleSearches.map((e) => (
                <TouchableOpacity
                  onPress={() => setSearch(e)}
                  key={e}
                  className="mb-2"
                >
                  <Text className="text-purple-600">{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

type Props = {
  ids?: string[] | null;
  renderItem: (data: BaseItemDto[]) => React.ReactNode;
  header?: string;
};

const SearchItemWrapper: React.FC<Props> = ({ ids, renderItem, header }) => {
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
        })
      );

      const results = await Promise.all(itemPromises);

      // Filter out null items
      return results.filter(
        (item) => item !== null
      ) as unknown as BaseItemDto[];
    },
    enabled: !!ids && ids.length > 0 && !!api && !!user?.Id,
    staleTime: Infinity,
  });

  if (!data) return null;

  return (
    <>
      <Text className="font-bold text-2xl px-4 my-2">{header}</Text>
      {renderItem(data)}
    </>
  );
};
