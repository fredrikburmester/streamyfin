import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { HorizontalScroll } from "../common/HorrizontalScroll";
import { Text } from "../common/Text";
import Poster from "../Poster";
import ContinueWatchingPoster from "../ContinueWatchingPoster";
import { ItemCardText } from "../ItemCardText";
import { router } from "expo-router";
import { nextUp } from "@/utils/jellyfin";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { apiAtom, userAtom } from "@/providers/JellyfinProvider";

export const NextUp: React.FC<{ seriesId: string }> = ({ seriesId }) => {
  const [user] = useAtom(userAtom);
  const [api] = useAtom(apiAtom);

  const { data: items } = useQuery({
    queryKey: ["nextUp", seriesId],
    queryFn: async () =>
      await nextUp({
        userId: user?.Id,
        api,
        itemId: seriesId,
      }),
    enabled: !!api && !!seriesId && !!user?.Id,
    staleTime: 0,
  });

  if (!items?.length)
    return (
      <View>
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
              router.push(`/(auth)/items/${item.Id}/page`);
            }}
            key={item.Id}
            className="flex flex-col w-32"
          >
            <ContinueWatchingPoster item={item} />
            <ItemCardText item={item} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
