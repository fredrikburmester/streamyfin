import { Text } from "@/components/common/Text";
import { Loading } from "@/components/Loading";
import MoviePoster from "@/components/MoviePoster";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { Ionicons } from "@expo/vector-icons";
import {
  BaseItemDto,
  ItemSortBy,
} from "@jellyfin/sdk/lib/generated-client/models";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

const page: React.FC = () => {
  const searchParams = useLocalSearchParams();
  const { collection: collectionId } = searchParams as { collection: string };

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  useEffect(() => {
    console.log("CollectionId", collectionId);
  }, [collectionId]);

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
    enabled: !!api && !!user?.Id,
    staleTime: 0,
  });

  const [startIndex, setStartIndex] = useState<number>(0);

  const { data, isLoading, isError } = useQuery<{
    Items: BaseItemDto[];
    TotalRecordCount: number;
  }>({
    queryKey: ["collection-items", collectionId, startIndex],
    queryFn: async () => {
      if (!api || !collectionId)
        return {
          Items: [],
          TotalRecordCount: 0,
        };

      const sortBy: ItemSortBy[] = [];

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

      const response = await getItemsApi(api).getItems({
        userId: user?.Id,
        parentId: collectionId,
        limit: 100,
        startIndex,
        sortBy,
        sortOrder: ["Ascending"],
      });

      const data = response.data.Items;

      return {
        Items: data || [],
        TotalRecordCount: response.data.TotalRecordCount || 0,
      };
    },
    enabled: !!collectionId && !!api,
  });
  // const { data, isLoading, isError } = useQuery<{
  //   Items: BaseItemDto[];
  //   TotalRecordCount: number;
  // }>({
  //   queryKey: ["collection-items", collectionId, startIndex],
  //   queryFn: async () => {
  //     if (!api) return [];

  //     const response = await api.axiosInstance.get(
  //       `${api.basePath}/Users/${user?.Id}/Items`,
  //       {
  //         params: {
  //           SortBy:
  //             collection?.CollectionType === "movies"
  //               ? "SortName,ProductionYear"
  //               : "SortName",
  //           SortOrder: "Ascending",
  //           IncludeItemTypes:
  //             collection?.CollectionType === "movies" ? "Movie" : "Series",
  //           Recursive: true,
  //           Fields:
  //             collection?.CollectionType === "movies"
  //               ? "PrimaryImageAspectRatio,MediaSourceCount"
  //               : "PrimaryImageAspectRatio",
  //           ImageTypeLimit: 1,
  //           EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
  //           ParentId: collectionId,
  //           Limit: 100,
  //           StartIndex: startIndex,
  //         },
  //         headers: {
  //           Authorization: `MediaBrowser DeviceId="${api.deviceInfo.id}", Token="${api.accessToken}"`,
  //         },
  //       },
  //     );

  //     return response.data || [];
  //   },
  //   enabled: !!collection && !!api,
  // });

  const totalItems = useMemo(() => {
    return data?.TotalRecordCount;
  }, [data]);

  return (
    <ScrollView>
      <View>
        <View className="px-4 mb-4">
          <Text className="font-bold text-3xl mb-2">{collection?.Name}</Text>
          <View className="flex flex-row items-center justify-between">
            <Text>
              {startIndex + 1}-{Math.min(startIndex + 100, totalItems || 0)} of{" "}
              {totalItems}
            </Text>
            <View className="flex flex-row items-center space-x-2">
              <TouchableOpacity
                onPress={() => {
                  setStartIndex((prev) => Math.max(prev - 100, 0));
                }}
              >
                <Ionicons
                  name="arrow-back-circle-outline"
                  size={32}
                  color="white"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setStartIndex((prev) => prev + 100);
                }}
              >
                <Ionicons
                  name="arrow-forward-circle-outline"
                  size={32}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {isLoading ? (
          <View className="my-12">
            <ActivityIndicator color={"white"} />
          </View>
        ) : (
          <View className="flex flex-row flex-wrap">
            {data?.Items?.map((item: BaseItemDto, index: number) => (
              <TouchableOpacity
                style={{
                  maxWidth: "33%",
                  width: "100%",
                  padding: 10,
                }}
                key={index}
                onPress={() => {
                  if (item?.Type === "Series") {
                    router.push(`/series/${item.Id}/page`);
                  } else if (item.IsFolder) {
                    router.push(`/collections/${item?.Id}/page`);
                  } else {
                    router.push(`/items/${item.Id}/page`);
                  }
                }}
              >
                <View className="flex flex-col gap-y-2">
                  <MoviePoster item={item} />
                  <Text>{item.Name}</Text>
                  <Text className="opacity-50 text-xs">
                    {item.ProductionYear}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      {!isLoading && (
        <View className="flex flex-row items-center space-x-2 justify-center mt-4 mb-12">
          <TouchableOpacity
            onPress={() => {
              setStartIndex((prev) => Math.max(prev - 100, 0));
            }}
          >
            <Ionicons
              name="arrow-back-circle-outline"
              size={32}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setStartIndex((prev) => prev + 100);
            }}
          >
            <Ionicons
              name="arrow-forward-circle-outline"
              size={32}
              color="white"
            />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default page;
