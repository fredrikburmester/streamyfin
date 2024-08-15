import ArtistPoster from "@/components/ArtistPoster";
import { Text } from "@/components/common/Text";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { FlatList, ScrollView, TouchableOpacity, View } from "react-native";

export default function page() {
  const searchParams = useLocalSearchParams();
  const { artistId } = searchParams as {
    artistId: string;
  };

  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const navigation = useNavigation();

  const [startIndex, setStartIndex] = useState<number>(0);

  const { data: artist } = useQuery({
    queryKey: ["album", artistId],
    queryFn: async () => {
      if (!api) return null;
      const response = await getItemsApi(api).getItems({
        userId: user?.Id,
        ids: [artistId],
      });
      const data = response.data.Items?.[0];
      return data;
    },
    enabled: !!api && !!user?.Id && !!artistId,
    staleTime: 0,
  });

  const {
    data: albums,
    isLoading,
    isError,
  } = useQuery<{
    Items: BaseItemDto[];
    TotalRecordCount: number;
  }>({
    queryKey: ["albums", artistId, startIndex],
    queryFn: async () => {
      if (!api)
        return {
          Items: [],
          TotalRecordCount: 0,
        };

      const response = await getItemsApi(api).getItems({
        userId: user?.Id,
        parentId: artistId,
        sortOrder: ["Descending", "Descending", "Ascending"],
        includeItemTypes: ["MusicAlbum"],
        recursive: true,
        fields: [
          "ParentId",
          "PrimaryImageAspectRatio",
          "ParentId",
          "PrimaryImageAspectRatio",
        ],
        collapseBoxSetItems: false,
        albumArtistIds: [artistId],
        startIndex,
        limit: 100,
        sortBy: ["PremiereDate", "ProductionYear", "SortName"],
      });

      const data = response.data.Items;

      return {
        Items: data || [],
        TotalRecordCount: response.data.TotalRecordCount || 0,
      };
    },
    enabled: !!api && !!user?.Id,
  });

  useEffect(() => {
    navigation.setOptions({
      title: albums?.Items?.[0].AlbumArtist,
    });
  }, [albums]);

  if (!artist || !albums) return null;

  return (
    <FlatList
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 140,
      }}
      ListHeaderComponent={
        <View className="mb-2">
          <View className="w-32 mb-4">
            <ArtistPoster item={artist} />
          </View>
          <Text className="font-bold text-2xl mb-4">Albums</Text>
        </View>
      }
      nestedScrollEnabled
      data={albums.Items}
      numColumns={3}
      columnWrapperStyle={{
        justifyContent: "space-between",
      }}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={{ width: "30%" }}
          key={index}
          onPress={() => {
            router.push(`/albums/${item.Id}`);
          }}
        >
          <View className="flex flex-col gap-y-2">
            <ArtistPoster item={item} />
            <Text>{item.Name}</Text>
            <Text className="opacity-50 text-xs">{item.ProductionYear}</Text>
          </View>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.Id || ""}
    />
  );
}
