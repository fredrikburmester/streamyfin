import MoviePoster from "@/components/posters/MoviePoster";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { ScrollView, TouchableOpacity, View, ViewProps } from "react-native";
import { Text } from "./common/Text";
import { ItemCardText } from "./ItemCardText";
import { Loader } from "./Loader";

interface SimilarItemsProps extends ViewProps {
  itemId: string;
}

export const SimilarItems: React.FC<SimilarItemsProps> = ({
  itemId,
  ...props
}) => {
  const [api] = useAtom(apiAtom);
  const [user] = useAtom(userAtom);

  const { data: similarItems, isLoading } = useQuery<BaseItemDto[]>({
    queryKey: ["similarItems", itemId],
    queryFn: async () => {
      if (!api || !user?.Id) return [];
      const response = await getLibraryApi(api).getSimilarItems({
        itemId,
        userId: user.Id,
        limit: 5,
      });

      return response.data.Items || [];
    },
    enabled: !!api && !!user?.Id,
    staleTime: Infinity,
  });

  const movies = useMemo(
    () => similarItems?.filter((i) => i.Type === "Movie") || [],
    [similarItems]
  );

  return (
    <View {...props}>
      <Text className="px-4 text-lg font-bold mb-2">Similar items</Text>
      {isLoading ? (
        <View className="my-12">
          <Loader />
        </View>
      ) : (
        <ScrollView horizontal>
          <View className="px-4 flex flex-row gap-x-2">
            {movies.map((item) => (
              <TouchableOpacity
                key={item.Id}
                onPress={() => router.push(`/items/${item.Id}`)}
                className="flex flex-col w-32"
              >
                <MoviePoster item={item} />
                <ItemCardText item={item} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
      {movies.length === 0 && <Text className="px-4">No similar items</Text>}
    </View>
  );
};
