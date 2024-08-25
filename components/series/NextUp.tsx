import { apiAtom, userAtom } from "@/providers/JellyfinProvider";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAtom } from "jotai";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { HorizontalScroll } from "../common/HorrizontalScroll";
import { Text } from "../common/Text";
import ContinueWatchingPoster from "../ContinueWatchingPoster";
import { ItemCardText } from "../ItemCardText";

export const NextUp: React.FC<{ seriesId: string }> = ({ seriesId }) => {
  const [user] = useAtom(userAtom);
  const [api] = useAtom(apiAtom);

  const { data: items } = useQuery({
    queryKey: ["nextUp", seriesId],
    queryFn: async () => {
      if (!api) return null;
      return (
        await getTvShowsApi(api).getNextUp({
          userId: user?.Id,
          seriesId,
          fields: ["MediaSourceCount"],
          limit: 10,
        })
      ).data.Items;
    },
    enabled: !!api && !!seriesId && !!user?.Id,
    staleTime: 0,
  });

  if (!items?.length)
    return (
      <View className="px-4">
        <Text className="text-lg font-bold mb-2">Next up</Text>
        <Text className="opacity-50">No items to display</Text>
      </View>
    );

  return (
    <View>
      <Text className="text-lg font-bold mb-2 px-4">Next up</Text>
      <HorizontalScroll<BaseItemDto>
        data={items}
        renderItem={(item, index) => (
          <TouchableOpacity
            onPress={() => {
              router.push(`/(auth)/items/${item.Id}`);
            }}
            key={item.Id}
            className="flex flex-col w-44"
          >
            <ContinueWatchingPoster item={item} />
            <ItemCardText item={item} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
